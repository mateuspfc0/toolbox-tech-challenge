const app = require('./src/app');
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.debug(`API server running on port ${PORT}`);
});
