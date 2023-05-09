const pool = require('./database')
const { google } = require('googleapis')
const pagespeed = google.pagespeedonline('v5')

const schedule = require('node-schedule');

// const job = schedule.scheduleJob('0 0 12 * * *', function(){
//   console.log('The answer to life, the universe, and everything!');
// });

const job = schedule.scheduleJob('0 5 12 * * *', async () => {
    const [paises] = await pool.query('SELECT iso_code FROM paises')
    const [empresas] = await pool.query('SELECT nombre FROM empresas')
    const links = []

    for (let i = 0; i < paises.length; i++) {
        for (let j = 0; j < empresas.length; j++) {
            let [tabla] = await pool.query('SELECT TABLE_NAME FROM information_schema.TABLES WHERE table_name = "' + empresas[j].nombre + '_' + paises[i].iso_code + '"')
            if (tabla.length > 0) {
                const [rows] = await pool.query('SELECT DISTINCT url_destino FROM ' + empresas[j].nombre + '_' + paises[i].iso_code)
                for (let k = 0; k < rows.length; k++) {
                    links.push(rows[k].url_destino)
                }
            }
        }
    }

    console.log(links)
    let [res] = await pool.query('DELETE FROM carga_pagina')

    for (let i = 0; i < links.length; i++) {
        console.log(links[i])
        try {
            const data = await pagespeed.pagespeedapi.runpagespeed({
                key: process.env.GOOGLE_API_KEY,
                url: links[i],
                options: {
                    strategy: 'desktop',
                    category: ['performance']
                }
            })
            const [rows] = await pool.query('INSERT INTO carga_pagina VALUES ("' +
            links[i] + '", ' +
            (data.data.loadingExperience.hasOwnProperty("overall_category") ? '"' + data.data.loadingExperience.overall_category + '"' : 'null' ) + ', ' +
            (data.data.loadingExperience.metrics.hasOwnProperty("CUMULATIVE_LAYOUT_SHIFT_SCORE") ? '"' + data.data.loadingExperience.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.category + '"' : 'null' ) + ', ' +
            (data.data.loadingExperience.metrics.hasOwnProperty("EXPERIMENTAL_INTERACTION_TO_NEXT_PAINT") ? '"' + data.data.loadingExperience.metrics.EXPERIMENTAL_INTERACTION_TO_NEXT_PAINT.category + '"' : 'null' ) + ', ' +
            (data.data.loadingExperience.metrics.hasOwnProperty("EXPERIMENTAL_TIME_TO_FIRST_BYTE") ? '"' + data.data.loadingExperience.metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE.category + '"' : 'null' ) + ', ' +
            (data.data.loadingExperience.metrics.hasOwnProperty("FIRST_CONTENTFUL_PAINT_MS") ? '"' + data.data.loadingExperience.metrics.FIRST_CONTENTFUL_PAINT_MS.category + '"' : 'null' ) + ', ' +
            (data.data.loadingExperience.metrics.hasOwnProperty("FIRST_INPUT_DELAY_MS") ? '"' + data.data.loadingExperience.metrics.FIRST_INPUT_DELAY_MS.category + '"' : 'null' ) + ', ' +
            (data.data.loadingExperience.metrics.hasOwnProperty("LARGEST_CONTENTFUL_PAINT_MS") ? '"' + data.data.loadingExperience.metrics.EXPERIMENTAL_INTERACTION_TO_NEXT_PAINT.category + '"' : 'null' ) + ', ' +
            (data.data.originLoadingExperience.hasOwnProperty("overall_category") ? '"' + data.data.originLoadingExperience.overall_category + '"' : 'null' ) + ', ' +
            (data.data.originLoadingExperience.metrics.hasOwnProperty("CUMULATIVE_LAYOUT_SHIFT_SCORE") ? '"' + data.data.originLoadingExperience.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.category + '"' : 'null' ) + ', ' +
            (data.data.originLoadingExperience.metrics.hasOwnProperty("EXPERIMENTAL_INTERACTION_TO_NEXT_PAINT") ? '"' + data.data.originLoadingExperience.metrics.EXPERIMENTAL_INTERACTION_TO_NEXT_PAINT.category + '"' : 'null' ) + ', ' +
            (data.data.originLoadingExperience.metrics.hasOwnProperty("EXPERIMENTAL_TIME_TO_FIRST_BYTE") ? '"' + data.data.originLoadingExperience.metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE.category + '"' : 'null' ) + ', ' +
            (data.data.originLoadingExperience.metrics.hasOwnProperty("FIRST_CONTENTFUL_PAINT_MS") ? '"' + data.data.originLoadingExperience.metrics.FIRST_CONTENTFUL_PAINT_MS.category + '"' : 'null' ) + ', ' +
            (data.data.originLoadingExperience.metrics.hasOwnProperty("FIRST_INPUT_DELAY_MS") ? '"' + data.data.originLoadingExperience.metrics.FIRST_INPUT_DELAY_MS.category + '"' : 'null' ) + ', ' +
            (data.data.originLoadingExperience.metrics.hasOwnProperty("LARGEST_CONTENTFUL_PAINT_MS") ? '"' + data.data.originLoadingExperience.metrics.LARGEST_CONTENTFUL_PAINT_MS.category + '"' : 'null' ) + ')'
            )
            //console.log(rows)
        } catch (error) {
            console.log(error)
        }
    }
})

// pageSpeed()
