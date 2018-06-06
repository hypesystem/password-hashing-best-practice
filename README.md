password-hashing-best-practice
==============================

How exactly should you hash passwords in your Node.js application?
Well, you shouldn't reinvent the wheel, and you should try to avoid implementing your own crypto.

This library provdies a single solution for commonly needed methods to use when hashing passwords, with all implementation details abstracted away.

Furthermore, the repository will be home to discussion on how to decide on current best practice, which means that the practice may change, when recommendations for hashing change.
If best practice changes, a breaking change of the library will be released.

Contents
--------

- [API and use](#api-and-use)
- [Method for deciding best practice](#method-for-deciding-best-practice)
- [Current best practice](#current-best-practice)

We are currently pre-1.0, which means the library should be considered unstable.
It is probably better than implementing your own crypto, but we don't know the quality of the code.
You can find a description of how we will make it to 1.0 in the [TODO](TODO.md).

If you wish to contribute, we have [a guideline with ideas](CONTRIBUTING.md) for how you might do that.

Notice that the project has a [Code of Conduct](CODE_OF_CONDUCT.md) that we expect contributors (of questions, code, tests, documentation, or anything else) to adhere to.

API and use
-----------

The package is installed with npm, by running the following command:

```sh
npm i password-hashing-best-practice
```

In your code, you can access the package by requiring it in:

```js
const phbp = require("password-hashing-best-practice");
```

The current API offers two functions.

Both functions take an optional callback.
If no callback is provided, the result will be returned in a `Promise` instead.
Each function has a single result, which may be an object containing several values.

### hash

This method simply hashes a password and a salt into a hashed password.

```js
phbp.hash(password[, salt][, callback]);
```

**Inputs.**

- password `<string> | <Buffer> | <TypedArray>` **required**.
  The password to be hashed.
  If it is a string, it is assumed to be `utf8`-encoded.
- salt `<string> | <Buffer> | <TypedArray>` *optional*.
  An optional salt to use for hashing the password.
  If it is a string, it is assumed to be `utf8`-encoded.
  If you want to use another encoding, you should transform it to a `Buffer` first.
  If no salt is supplied, a 32 byte random value will be generated and used as salt.
  **In most cases you should leave out the salt**.
  If you need to compare hashed passwords, use the `compare` function, below.
- callback `<function>` *optional*.
  A callback function containing the *return value* (see below) or errors of computing the hash.
  If it is left out, the result is returned as a `Promise` instead.

**Return value.**
The function returns an object with two fields:

- hashedPassword `<Buffer>`.
  The result of hashing the password with the salt.
  This is safe to store in the database.
- salt `<Buffer>`.
  The salt that was used to hash the password.
  Should likewise be stored in the database, so you can retrieve it to verify passwords in the future.

For example:

```js
let { hashedPassword, salt } = await phbp.hash(password, salt);
```

... or ...

```js
phbp.hash(password, salt, (error, { hashedPassword, salt }) => {
    if(error) {
        //...
    }
    // ...
});
```

### compare

When a user is logging in, you need to verify that their newly entered password matches the one that belongs to their user account.
It is important to use a safe comparison method to avoid timing attacks, which this method implements.
You can do this by fetching the `hashedPassword` and `salt` that were saved from the user:

```js
phbp.compare(password, salt, hashedPassword[, callback])
```

**Inputs.**

- password `<string> | <Buffer> | <TypedArray>` **required**.
  The new password we want to verify the correctness of.
- salt `<Buffer>` **required**.
  The salt that was used for creating the hashed password.
- hashedPassword `<Buffer>` **required**.
  The hashed password that was created when setting the password for the user.
- callback `<function>` *optional*.
  A callback function containing the *return value* (see below) or errors of computing the hash.
  If it is left out, the result is returned as a `Promise` instead.

**Return value.**
A single `<boolean>` value, which is `true` if the password hashed with the salt is the same as the hashed password, and `false` otherwise.

For example:

```js
if(await phbp.compare(password, salt, hashedPassword)) {
    //Password matches!
}
else {
    //Password does not match.
}
```

... or ...

```js
phbp.compare(password, salt, hashedPassword, (error, passwordMatches) => {
    if(error) {
        // ...
    }

    if(passwordMatches) {
        //Password matches!
    }
    else {
        //Password does not match.
    }
});
```

### How to handle `Buffer`s

The hashed password and the salt are both returned as `Buffer`s, which may make them hard to store.
A simple way of making them easy to store is transforming them to their corresponding hex values, by calling `buf.toString("hex")`.
Before using them in password hashing functions again, you will need to transform them to `Buffer`s again, which can be done with `Buffer.from(str, "hex")`.

For example:

```js
//Given a `password` on user creation...
let { hashedPassword, salt } = await phbp.hash(password);
setUserPassword({
    hashedPasswordHex: hashedPassword.toString("hex"),
    saltHex: salt.toString("hex");
});

// Later, given a new `password` as input from the user...
let { hashedPasswordHex, saltHex } = getUserPassword();
let salt = Buffer.from(saltHex, "hex");
let hashedPassword = Buffer.from(hashedPasswordHex, "hex");

if(await phbp.compare(password, salt, hashedPassword)) {
    //User is authenticated!
}
```

Method for deciding best practice
---------------------------------

- OWASP, NIST, password-hashing
- native implementation > module implementation (fast implementation, slow algorithm pls)
- audit > no audit (which have been audited?)
- link to ongoing discussion on authorities (stackexchange)

Current best practice
---------------------

- According to above evaluation criteria...
- We have evaluated... (links to evaluation reports)
- pbkdf2 because it is native and in Node.js (so probably more audited and npm packages?)
