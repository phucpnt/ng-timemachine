# AngularJS application setup - The motivation

When I first starting working on angularJS, I was amazed by its ability to expressing the HTML in expressive manners.
It come from the Directive setup in AngularJS. At that time, using the **ngController** in AngularJS sound a natural flow
to develop an application for me. I has been developed applications using BackboneJS for a while, so MVC structure is
familiar with me in web APP development.

AngularJS when comparing with BackboneJS is quite fun and more productivity for me to work with. I found it is very
interesting the way ngRepeat works comparing to BackboneJS collections :-).
And how the AngularJS APP **respond to data changes** in easy and appealing way compare to BackboneJS.
At the heart of AngularJS APP, **Directive** is an important point to keep the APP setup in module way.

Soon I see that we can totally reduce the use of *Controller* in flavor of more use of **Directive**.

When switching from BackboneJS to AngularJS, there is one minor issue for me is Backbone treat data more strict than
AngularJS. I also think it is the flexibility of AngularJS.

AngularJS is the framework my company used, the front-end team (I work for) has been take advantage of the flexibility
of AngularJS in messy way ;-(. It is too much pain for maintenance and update the application especially with the **Data**.
Passing data: object, array of object etc... in JS as default is passing the **pointer**. Which become a nightmare
to track where the *Data* has been update, where the field of an object has been update/replace/remove.
Should we use unit test to reduce the pain we have when developing and web application. I believe we can.

I find out the front end team has been pushing very hard and constantly from the product owners. We have pressure to
deliver product as fast as possible. Develop the product then maintenance the unittest seems to be too hard for my
teammate as we keep rushing to deliver product.

* There should be another way to enjoy developing web APP with AngularJS.
* There should be a way to easily control the data flow in sophisticated web app.
* It should be simple, easy and fun to grasp and adapt.

This structure is inspired by FLUX from Reactjs and timemachine is inspired by Redux
