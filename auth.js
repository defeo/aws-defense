const crypto = require('crypto');

const secret = process.env.SECRET || '12345';
const tokenEnc = 'base64';
const hash = 'sha256';

exports.createToken = () =>
    new Promise((resolve, reject) => {
	const hmac = crypto.createHmac(hash, secret);
	crypto.randomBytes(16, (err, buf) => {
	    if (err) {
		reject(err);
	    } else {
		const id = buf.toString(tokenEnc);
		hmac.update(id);
		resolve({
		    id: id,
		    token: id + '|' + hmac.digest(tokenEnc),
		});
	    }
	});
    });

const decodeToken = exports.decodeToken = (token) => {
    const hmac = crypto.createHmac(hash, secret);
    token = token.split('|');
    hmac.update(token[0]);
    if (hmac.digest(tokenEnc) !== token[1])
	throw new Error('Invalid token');
    return token[0];
}

exports.express_auth = (req, res, next) => {
    req.user = null;
    if (req.headers.authorization) {
	try {
	    const token = req.headers.authorization.match(/bearer (.*)/)[1];
	    const id = decodeToken(token);
	    req.user = id || null;
	} catch (e) {
	    res.status(401).send('Authentication error.');
	    return;
	}
    }
    next();
};
