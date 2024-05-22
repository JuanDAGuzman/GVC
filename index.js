const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');
const cors = require('cors'); // Importa el middleware CORS

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors()); // Usa el middleware CORS
app.use('/api', routes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
