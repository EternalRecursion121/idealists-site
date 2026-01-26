---
title: we shouldn't be content with low bandwidth communication
description: we are having sex and waging war down the same channel built to cite academic articles
author: meg, ?
---

## (mandatory initial anecdote)
my tutor once told me how i'm very easily read in tutorials. he knows when i'm enjoying myself, when i'm disinterested, when i understand; it's written plainly on my face, allegedly. 

despite how much it unnerved me to find out (not for the first time) that i am easy to read, i think this is necessary for a productive class. in fact, this is extremely useful in all kinds of relationships: relying on others to flatten thoughts into language and still convey their complexity is an intractable request. as an example, it's very affirming when a friend asks about your awful day despite you never mentioning you were having one. it turns out they could just tell by your outfit choice, or posture, or the ambience you brought to a room. or even some signifier that itself couldn't be flattened into language, either.

i'm going to label this ability to digest lots of little details simultaneously as **multithreaded communication**: it is _maybe_ possible to transform each stream of information into text and send it down a single channel, but processing all of this detail in sequence would take an incredibly long time.
## lossy compression is the norm online
> _as renton from trainspotting said, Choose customisation... Choose a username. Choose a bio. Choose a profile picture. Choose a fucking bitmoji design, choose 15s of a song, a profile banner and a pinned instagram post._

the number of communication channels big tech gives us is O(1). this makes a lot of sense; remaining easily parametrizable is crucial for the storage and analysis of data, and allowing greater degrees of freedom makes it more difficult to parse a person, and keep a platform robust against cyber attacks. a platform which serial communication avoids a lot of complexity.

yet we have allowed ourselves to become complacent with this one-dimensional data transfer: our complex emotional expressions are flattened into button toggles (like/repost), debates and thoughts are truncated by a character limit, and the media we consume is a serial scrolling feed with very little notion of choice. this is lossy compression.

modern social media's rate of information transfer is maliciously low – so low that some crucial data is never sent at all. we can digest data online very quickly because there is barely any of it; any message has been compressed into a few serial streams. it _feels_ fast because the physical manifestation of information is changing very rapidly, but we struggle to retain it. in this sense, multithreaded communication is an efficiency speedup: it lets you send n bits of data in a single moment of time, given that you have a means of parallel processing (which, thankfully, [we do](https://en.wikipedia.org/wiki/Parallel_processing_(psychology))). it is _lossless compression_ of information.

why is this something we should want? i would argue that being able to provide more information results (loosely...) in better mutual understanding, faster. mutual understanding gives way to more constructive conversation/debate. from this we build communities more robust against bad actors that. there is also an extension of this which looks something like: 
_giving people more understanding of a tool/concept/experience/space they interact allows them more control over it. something the internet is lacking is personal autonomy, directly caused by _  

## a little counterpoint
> "but megan, isn't there a reason we have such little control over ourselves online? we feasibly cannot expect to be able to send an unbounded amount of information to another person, because that takes an unbounded length of time. the small channels we have so far are all that is feasible to ensure our software actually loads."

i'd like to counter this with the idea of telemetry.

so far i've been arguing that the amount of information we can send to others is extremely limited. but in fact, there *are* many streams of data passing from you to the platforms you use. button presses and comments are the few channels we are conscious of, but in reality there are many more that we never knowingly experience. the length of time you linger over a post, the times of day you are most online, the emails you open, the links you follow, *the subconscious choices you make*. this information is always passing from you to the platform, and used to fine-tune the content-serving algorithms written into everything we use. this adds up to be an immense amount of data, excessively large, all taken and used against us.

the evidence for the success of this subconscious multithreaded communication can be seen in algorithmic recommendations. these systems understand us better than we understand ourselves; what would the outcome be if we could use this derived understanding for ourselves? multithreaded communication is wholly possible, just out of the hands of the individual.

## making this a little more formal
one example of how communication is hindered is through the expressivity of the platforms we use. pls forgive me but i have a little linear algebra model for how i consider this to work:
let $v =$ vector of the raw concept/information you want to transmit,
$M =$ the matrix representing the medium through which you are conveying this (raw text, 2D animation, physical objects, etc),
$T =$ the matrix representing the conceptual tooling you are using (the way you structure the problem, the actions you are presented with after this. for example, the tooling i have used here is linear algebra, something i feel to be quite expressive!!),
$l =$ the vector representing the lived experience of anyone observing the concept/information you are transmitting.
we can then construct the formula $MTv = l$. ordering matters here [i'll say more probably at some point]

## our future -!
i think a small part of this problem stems from the existence that the internet started with. we are now having sex and [waging war](https://www.washingtonpost.com/technology/2022/03/01/social-media-ukraine-russia/) down the same channels built to cite academic articles. to use online space to its full potential, we need to stop treating our platforms as a product and more as a substrate: a medium we [live on top of](https://alarmingdevelopment.org/?p=1842), [consume](https://ponder.org.uk/post/2025-06-03-substrates-vision/), [reshape](https://www.humprog.org/~stephen/research/papers/kell25substratus.pdf).

personal websites are a beautiful way of practicing multithreaded-ness, though more diverse examples exist. malleable software give users the freedom to bend their programs to their will, visual programming languages communicate their purpose much faster than just plaintext. matrix and atproto are state of the art protocols letting users take control of their algorithms. solidjs gives users control over their data stores, letting them inject information into applications that support it. i'm sure there are many more examples i am missing out on here (feel free to let me know of any i've missed).

[talk about dynamic land here megan]

importantly, nothing inherent in the internet's design mandates flatness. we just seem to have neglected the existence of anything else.

it is perhaps time to reclaim the art of being uncountably expressive.
