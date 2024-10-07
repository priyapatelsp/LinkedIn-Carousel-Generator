
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });


const app = express();
const port = 5001;

app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});


app.post('/generate-pdf', upload.fields([{ name: 'profileImage' }, { name: 'images', maxCount: 10 }, { name: 'backgrounds', maxCount: 10 }]), (req, res) => {
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];

    if (req.files['profileImage'] && !validMimeTypes.includes(req.files['profileImage'][0].mimetype)) {
        return res.status(400).json({ error: 'Invalid profile image type. Only images are allowed.' });
    }
    if (req.files['images']) {
        for (const file of req.files['images']) {
            if (!validMimeTypes.includes(file.mimetype)) {
                return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
            }
        }
    }

    if (req.files['backgrounds']) {
        for (const file of req.files['backgrounds']) {
            if (!validMimeTypes.includes(file.mimetype)) {
                return res.status(400).json({ error: 'Invalid background image type. Only images are allowed.' });
            }
        }
    }

    let slides;
    try {
        slides = JSON.parse(req.body.slides);
    } catch (error) {
        return res.status(400).json({ error: 'Invalid slides data.' });
    }

    const doc = new PDFDocument();
    const filePath = path.join(__dirname, 'carousel.pdf');

    doc.pipe(fs.ßßcreateWriteStream(filePath));
    if (req.body.profileName) {
        doc.fillColor('Black'); 
        doc.fontSize(16).text(req.body.profileName, { align: 'cen', baseline: 'top', underline: true });
        doc.moveDown(); 
    }

    if (req.files['profileImage'] && req.files['profileImage'][0]) {
        doc.image(req.files['profileImage'][0].buffer, { fit: [100, 100], align: 'left', valign: 'bottom' });
    }

   

    slides.forEach((slide, index) => {
        doc.addPage();

        if (req.files['backgrounds'] && req.files['backgrounds'][index]) {
            doc.image(req.files['backgrounds'][index].buffer, {
                fit: [doc.page.width, doc.page.height],
                align: 'center',
                valign: 'center',
                opacity: slide.transparency 
            });
        }

        if (req.files['images'] && req.files['images'][index]) {
            doc.image(req.files['images'][index].buffer, { fit: [200, 200], align: 'center', valign: 'center' });
        }

        doc.fillColor('#333333'); 
        doc.fontSize(24).text(slide.title, { align: 'center' });
    });

    doc.end();

    res.download(filePath, 'carousel.pdf', (err) => {
        if (err) {
            console.error('Error sending PDF:', err);
            return res.status(500).json({ error: 'Failed to send the PDF file.' });
        }
    });
});


app.get('/', (req, res) => {
    res.send('Welcome to the LinkedIn Carousel Generator API');
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
