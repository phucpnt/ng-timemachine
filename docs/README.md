# ngTimeMachine

## What is it?

The timeline machine is structure for easy build angular application.
It is heavily inspired by ReactJS and FLUX architecture.

With that structure you can easy manipulate the state/timeline of the application.

## Simple use case

**Let visualize the following example:**

* You are developing an angular APP. You are in the middle of implement a function which require getting data
from SERVER (REST api for example).
* To get to the point your APP firing request to SERVER, in the APP, user need to select (A), then select (B) then
the APP send request to SERVER base on user selections. After request successfully return, the APP would show user
screen (S)
* Every time you need to develop or fix or update screen (S) you need to repeat the select (A) -> select (B) -> then
waiting request to server -> then see if the screen (S) display correctly. If yes, it is wonderful. But most of the time
you need to develop/update/fix somethings on screen (S). Then after you update your APP you need to repeat those kind of
behaviors to get to see if the screen (S) works correctly.
* Is that story sound familiar to you? ;-)

**How this app structure solve the issue above:**

* With this app structure including the ngTimeMachine controls, you can easily frozen the timeline. Then you update your
APP in the background and refresh browser. The APP would showing you exactly the same state you freeze the time.
* Follow up to the story above. How this structure can be use to fix the issue:
  * You need to develop/fix/update the screen (S). At first time, as the user you do select (A) -> then select (B). Then
  you frozen the timeline.
  * You update your APP. Then you refresh the browser to see changes in your application. Immediately, (A) and (B) has
  been selected. And your APP doing the request to SERVER right away.
  * Even more what if your APP need to show some loading circle to notify the user. With the structure, you can freeze
  the timeline to develop the loading screen with easy.


## LICENSE
Apache 2.0
