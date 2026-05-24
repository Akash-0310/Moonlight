import jwt from 'jsonwebtoken'

const adminAuth = async (req, res, next) => {
    try {
        const { token } = req.headers
        if (!token) {
            return res.json({ success: false, message: "Not Authorized. Login Again" })
        }

        const token_decode = jwt.verify(token, process.env.JWT_SECRET)

        // verify decoded payload has admin email and role — not a string comparison
        if (!token_decode || token_decode.email !== process.env.ADMIN_EMAIL || token_decode.role !== 'admin') {
            return res.json({ success: false, message: "Not Authorized. Login Again" })
        }

        next()
    } catch (error) {
        // don't leak JWT error details to client
        res.json({ success: false, message: "Not Authorized. Login Again" })
    }
}

export default adminAuth
