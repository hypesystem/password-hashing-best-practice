const crypto = require("crypto");

module.exports = { hash, compare };

function hash(password, salt, callback) {
    if(typeof salt === "function") {
        callback = salt;
        salt = undefined;
    }

    let promise = ensureSalt(salt).then((salt) => hashWithSalt(password, salt));

    return returnPromiseOrCallback(promise, callback);
};

function ensureSalt(salt) {
    if(!salt) {
        return generateSalt();
    }
    if(!Buffer.isBuffer(salt)) {
        return Promise.resolve(Buffer.from(salt));
    }
    return Promise.resolve(salt);
}

function generateSalt() {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(32, (error, buffer) => {
            if(error) {
                return reject(error);
            }
            resolve(buffer);
        });
    });
}

function hashWithSalt(password, salt) {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, 10000, 32, 'sha256', (error, hashedPassword) => {
            if(error) {
                return reject(error);
            }
            resolve(hashedPassword.toString("hex"));
        });
    });
}

function returnPromiseOrCallback(promise, callback) {
    if(!callback) {
        return promise;
    }

    promise
        .then((result) => callback(null, result))
        .catch((error) => callback(error));
}

function compare(password, salt, oldHashedPassword, callback) {
    let promise = hashWithSalt(password, salt)
                    .then(({ hashedPassword }) => crypto.timingSafeEqual(oldHashedPassword, hashedPassword));

    return returnPromiseOrCallback(promise, callback);
}
