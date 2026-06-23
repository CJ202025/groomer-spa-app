fetch('http://localhost:3000/api/gestion-citas', {
  headers: {
    // We need to pass a valid session cookie to get past auth
    // But since we are outside the browser, we'll get "No autorizado"
  }
}).then(res => res.json()).then(console.log);
