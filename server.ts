import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { randomUUID } from 'crypto';

config({path:join(__dirname, '.env')});

const DAY_KEYS: {[key: string]: string} = {

};

const app = express();

app.use((req, res, next) => {
    console.log(`${req.headers['x-forwarded-for'] || req.ip} ${req.method} ${req.originalUrl}`);
    next();
});

app.set('view engine', 'ejs');
app.use('/assets', express.static(join(__dirname, 'views', 'assets')));
app.use(express.json());


app.get('/', (req, res) => {
    res.render('game');
});
app.get('/howtoplay', (req, res) => {
    res.render('howtoplay');
});
app.get('/admin', (req, res) => {
    if (!req.headers.cookie?.includes(`key=${process.env.MASTER_KEY}`)) return res.send(`<script>document.cookie='key='+prompt('Enter master key'); location.reload();</script>`);

    res.render('admin');
});
app.get('/modday', (req, res) => {
    if (!DAY_KEYS[req.query.key as string]) return res.status(401).end();

    res.render('admin');
});

app.get('/puzzle/:date', (req, res) => {
    const puzzles = JSON.parse(readFileSync(join(__dirname, 'puzzles.json'), 'utf-8'));

    if (!puzzles[req.params.date]) return res.status(404).end();
    res.json(puzzles[req.params.date]);
});
app.post('/update/:date', (req, res) => {
    // check if daily key
    if (DAY_KEYS[req.headers.daykey as string]) {
        const DAY = DAY_KEYS[req.headers.daykey as string];
        const puzzles = JSON.parse(readFileSync(join(__dirname, 'puzzles.json'), 'utf-8'));
        puzzles[DAY] = {
            words: req.body.words,
            by: req.body.by
        };
        writeFileSync(join(__dirname, 'puzzles.json'), JSON.stringify(puzzles));
        return res.status(206).end();
    }

    if (!req.headers.cookie?.includes(`key=${process.env.MASTER_KEY}`)) return res.status(401).end();

    const puzzles = JSON.parse(readFileSync(join(__dirname, 'puzzles.json'), 'utf-8'));
    puzzles[req.body.date] = {
        words: req.body.words,
        by: req.body.by
    };
    writeFileSync(join(__dirname, 'puzzles.json'), JSON.stringify(puzzles));
    res.status(206).end();
});

app.post('/make-key', (req, res) => {
    if (!req.headers.cookie?.includes(`key=${process.env.MASTER_KEY}`)) return res.status(401).end();
    const key = randomUUID();
    DAY_KEYS[key] = req.body.date;
    res.json({key});
});

app.listen(process.env.PORT).on('listening', () => {
    console.log(`listening on ${process.env.PORT}`);
});