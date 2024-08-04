import express from 'express';
import request from 'request';

const app = express();

const apiUrl = "https://todo.doczilla.pro/api";

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    next();
});

app.use('/api', (req, res) => {
    const url = apiUrl + req.url;
    console.log(url)
    req.pipe(request({ qs:req.query, uri: url })).pipe(res);
});

app.listen(3000, () => {
    console.log('Proxy server is running on port 3000');
});
