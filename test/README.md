# Testing #

This is using the [mocha][] javascript test framework.

We'll be running it out of the browser to test our client-side javascript.

Drop /test/index.html into your browser and the tests will run.

Any javascript files you'd like to test, as well as their dependencies,
should be referenced via script tags within index.html.

The actual tests you'll find within the /test/spec/ directory, generally
one spec file per javascript file you're testing.

Mocha allows you to use a number of assertion libraries; syntax for
your tests.  I've installed [chai][] only because
it was easy.  Chai has three different assertion styles, a [TDD][] style
and two [BDD][] styles.  BDD is more in vogue these days so I went with
that and chose 'expect' rather than 'should' only because 'should'
falls down when you run the tests in IE sometimes.

[mocha]: <http://visionmedia.github.io/mocha/> "feature-rich JavaScript test framework running on node and the browser"
[chai]: <http://chaijs.com> "Chai is a BDD / TDD assertion library for node and the browser"
[TDD]: <http://en.wikipedia.org/wiki/Test-driven_development> "Test-driven Development - wikipedia"
[BDD]: <http://en.wikipedia.org/wiki/Behavior-driven_development> "Behavior-driven Development - wikipedia"