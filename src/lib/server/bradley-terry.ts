/**
 * Bayesian Bradley–Terry: P(i beats j) = σ(θᵢ − θⱼ), with a N(0, priorSd²)
 * prior on every θ. We find the posterior mode by Newton's method and take the
 * covariance from the inverse Hessian there (a Laplace approximation), so
 * uncertainty reflects every vote at once, including indirect evidence:
 * A beating B and B beating C also tells us about A vs C.
 *
 * Pure and dependency-free so it can be tested outside SvelteKit.
 */

export interface Comparison {
	winner: number;
	loser: number;
	count: number;
}

export interface BradleyTerryFit {
	/** Strengths on the logit scale; 0 is an average vibe. */
	theta: Float64Array;
	/** Posterior covariance, row-major n×n. */
	cov: Float64Array;
	iterations: number;
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/** Gradient and Hessian of the log posterior at θ. */
function derivatives(n: number, comparisons: Comparison[], theta: Float64Array, precision: number) {
	const grad = new Float64Array(n);
	const hess = new Float64Array(n * n);
	for (let i = 0; i < n; i++) {
		grad[i] = -theta[i] * precision;
		hess[i * n + i] = precision;
	}
	for (const { winner: w, loser: l, count } of comparisons) {
		const p = sigmoid(theta[w] - theta[l]);
		grad[w] += count * (1 - p);
		grad[l] -= count * (1 - p);
		const h = count * p * (1 - p);
		hess[w * n + w] += h;
		hess[l * n + l] += h;
		hess[w * n + l] -= h;
		hess[l * n + w] -= h;
	}
	return { grad, hess };
}

/** In-place Cholesky factorisation (lower triangle) of a symmetric positive-definite matrix. */
function cholesky(a: Float64Array, n: number): Float64Array {
	const L = new Float64Array(n * n);
	for (let j = 0; j < n; j++) {
		let sum = a[j * n + j];
		for (let k = 0; k < j; k++) sum -= L[j * n + k] * L[j * n + k];
		const diag = Math.sqrt(sum);
		L[j * n + j] = diag;
		for (let i = j + 1; i < n; i++) {
			let s = a[i * n + j];
			for (let k = 0; k < j; k++) s -= L[i * n + k] * L[j * n + k];
			L[i * n + j] = s / diag;
		}
	}
	return L;
}

/** Solve (L Lᵀ) x = b. */
function choleskySolve(L: Float64Array, n: number, b: Float64Array): Float64Array {
	const y = new Float64Array(n);
	for (let i = 0; i < n; i++) {
		let s = b[i];
		for (let k = 0; k < i; k++) s -= L[i * n + k] * y[k];
		y[i] = s / L[i * n + i];
	}
	const x = new Float64Array(n);
	for (let i = n - 1; i >= 0; i--) {
		let s = y[i];
		for (let k = i + 1; k < n; k++) s -= L[k * n + i] * x[k];
		x[i] = s / L[i * n + i];
	}
	return x;
}

export function fitBradleyTerry(
	n: number,
	comparisons: Comparison[],
	{ priorSd = 1, init, maxIterations = 50, tolerance = 1e-9 }: { priorSd?: number; init?: Float64Array; maxIterations?: number; tolerance?: number } = {}
): BradleyTerryFit {
	const precision = 1 / (priorSd * priorSd);
	const theta = init ? Float64Array.from(init) : new Float64Array(n);

	let iterations = 0;
	for (; iterations < maxIterations; iterations++) {
		const { grad, hess } = derivatives(n, comparisons, theta, precision);
		const step = choleskySolve(cholesky(hess, n), n, grad);
		let largest = 0;
		for (let i = 0; i < n; i++) largest = Math.max(largest, Math.abs(step[i]));
		// The log posterior is concave, but damp huge first steps from a poor start.
		const scale = largest > 2 ? 2 / largest : 1;
		for (let i = 0; i < n; i++) theta[i] += scale * step[i];
		if (largest < tolerance) break;
	}

	// Covariance = inverse Hessian at the mode, one column at a time.
	const L = cholesky(derivatives(n, comparisons, theta, precision).hess, n);
	const cov = new Float64Array(n * n);
	const unit = new Float64Array(n);
	for (let j = 0; j < n; j++) {
		unit.fill(0);
		unit[j] = 1;
		const column = choleskySolve(L, n, unit);
		for (let i = 0; i < n; i++) cov[i * n + j] = column[i];
	}

	return { theta, cov, iterations };
}
