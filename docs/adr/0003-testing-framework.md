ADR - Testing Framework

Decision:
We chose Jest as the testing framework for our Equipment Checkout application.

Options Considered:
Jest
Mocha

Why We Chose It:
Jest is easy to set up and works well with Node.js and Express. It allows us to write automated tests to verify that our application is working correctly. Jest can also be integrated with GitHub Actions to automatically run tests when code is pushed or a pull request is created.

What We Are Giving Up:
By choosing Jest, we are giving up some of the flexibility offered by other testing frameworks like Mocha. Jest also includes features that we may not need for our project.
