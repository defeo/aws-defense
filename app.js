const express = require('express');
const yaml = require('yamljs');

const app = express();

const groups = yaml.load('.data/groups.yml');

app.use(express.static('client'));

app.get('/projects', (req, res) => res.json(groups));

app.listen(process.env.PORT);
