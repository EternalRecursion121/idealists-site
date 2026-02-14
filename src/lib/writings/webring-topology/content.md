---
title: More Interesting Webrings
author: sudarsh
date: 2026-02-02
description: can we make webrings more than circles?
draft: false
style: notebook
branches:
  - url: https://sudarsh.com/notebook/webring-topology/
    label: sudarsh.com
    repo: skunnavakkam/skunnavakkam.github.io
    path: content/notebook/webring-topology/index.md
---

me and my friends wanted to make a number of webrings, notably one for the [idealist's collective](https://idealistscollective.org/) and the [south hovses](https://en.wikipedia.org/wiki/House_system_at_the_California_Institute_of_Technology#South_houses). how do you arrange a number of webrings together in an interesting way?

for a single webring, if you enforce that each person has one neighbor on either side, you're kinda out of luck - a graph with no self-loops where every node has degree 2 is necessary cyclic, which means you have nothing but circles all the way down. although this proposition may excite the particle physicsts among us, it does not excite me.

we can instead have much more complicated graph geometries (and give choice!) if instead of webrings we tiled the plane with webtriangles - where every person in the graph is connected to three other people, like the edges of triangles. unfortunately, such a graph exists only for even $n$, where $n$ is the number of people in the webring, which means that one person would have to link somewhere that isn't a unique person in the case of odd $n$. however, we now have cute geometries! in the case of $n = 4$, we can arrange our webtriangles into a triangular pyramid!

we also have a cute geometry in the case of $k = 4$ connection per-person, in the case where our $n$ nodes are factorable into $n = n_1 \times n_2$, where you can lay your websquares into a $n_1 \times n_2$ rectangle, and connected edges to make a torus, or you can add a half twist when you connect two of the edges to make a webmobiusstrip.

i treat Hexagons are an extension of the triangle case, where it is as if each person were made up of six little homunculi, and i choose not to consider that (you may argue that in the $n = 3$ case it is as if the person is made up of four little homunculi, but you forgot that homunculi do not come in square numbers)

these are only cases with one webring though, but people often have multiple friends, and these multiple friends are often part of different sets. thus, people with rich social lives often may put multiple webrings on their webpage (or so I hear). we need to think of a solution for those people too.

each seperate webring can be a seperate island that are all connected together - and i think an apt name for this metaconnection of webrings is the webweb (which can be shortend to ww, or quadruple u) - and the menu gives you the ability to pick between webrings, or pick within members of the same webring.

![webweb](/writings/webring-topology/webweb.png)

we can think of different webrings within the webweb as islands, with individual people in multiple webrings acting as bridges, and the overall webweb navigation being flights or something between islands. each island has its own geometry induced by the degree of its graph, and the particle physicsts are all on the graph with degree 2. which island are you on if you're part of all three, for the webweb navigation purpose? well, we can bring in cookies.

we can track within webweb which webrings were visited, and fog of war webrings are two degrees away from any visited webrings, so you only see webrings that are distance one from the boundary of webrings you've visited, have leaderboards for the most traveled, and so on and so forth.

go forth! travel the webtriangles
