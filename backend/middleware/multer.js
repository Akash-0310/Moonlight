import multer from "multer"
import path from "path"

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const storage = multer.diskStorage({
    filename: function (req, file, callback) {
        // unique filename — prevents overwrites and path traversal
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
        callback(null, uniqueSuffix + path.extname(file.originalname).toLowerCase())
    }
})

const fileFilter = (req, file, callback) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        callback(null, true)
    } else {
        callback(new Error('Invalid file type. Only JPEG, PNG and WebP images are allowed.'), false)
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE }
})

export default upload
