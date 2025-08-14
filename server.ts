import express from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import {json, urlencoded} from 'body-parser';

config({path:join(__dirname, '.env')});

const app = express();

app.use((req, res, next) => {
    console.log(`${req.headers['x-forwarded-for'] || req.ip} ${req.method} ${req.originalUrl}`);
    next();
});

app.set('view engine', 'ejs');
app.use('/assets', express.static(join(__dirname, 'views', 'assets')));
app.use(json());


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

app.get('/puzzle/:date', (req, res) => {
    const puzzles = JSON.parse(readFileSync(join(__dirname, 'puzzles.json'), 'utf-8'));

    if (!puzzles[req.params.date]) return res.status(404).end();
    res.json(puzzles[req.params.date]);
});
app.post('/update/:date', (req, res) => {
    console.log(req.body);
    res.status(206).end();
});

app.listen(process.env.PORT).on('listening', () => {
    console.log(`listening on ${process.env.PORT}`);
});