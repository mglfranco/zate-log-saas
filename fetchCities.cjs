const fs = require('fs');
const https = require('https');

https.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados/42/municipios', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const cities = JSON.parse(data);
        const cityNames = cities.map(c => `${c.nome} - SC`);

        fs.writeFileSync(
            './src/data/scCities.js',
            `export const scCities = ${JSON.stringify(cityNames, null, 4)};\n`
        );
        console.log('Successfully generated src/data/scCities.js with ' + cityNames.length + ' cities.');
    });
}).on('error', err => {
    console.error('Error fetching cities:', err);
});
