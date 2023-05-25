const pool = require('./database')

const update = async () => {
    //set time period
    const [last] = await pool.query('SELECT MAX(fecha) as last from visibilidad_es')
    let last_date = new Date(last[0].last)
    last_date.setDate(last_date.getDate() + 1)
    let today = new Date()

    const [countries] = await pool.query('SELECT iso_code, micro from paises')
    const [companies] = await pool.query('SELECT nombre, url FROM empresas')
    keywords = ['%','microcemento', 'pintura', 'hormigon']

    for(let i=0; i<countries.length; i++){
        while(last_date <= today){
            console.log('PAIS: '+ countries[i].iso_code)
            
            entry = {}

            for (let j=0; j<companies.length; j++){
                console.log('Empresa: '+ companies[j].url)
                for(let l=0; l<keywords.length; l++){

                    let [sum0] = await pool.query('SELECT SUM(volume_search) as suma FROM kws_'+ countries[i].iso_code + ' WHERE target LIKE "'+ keywords[l] +'"')
                    const search_vol_micro = sum0[0].suma

                    let [kws] = await pool.query('SELECT kw FROM kws_'+ countries[i].iso_code + ' WHERE target LIKE "'+ keywords[l] +'"')
                    let suma = 0
                    
                    for(let k=0; k<kws.length; k++){
                        const [rank] = await pool.query('SELECT rank FROM rankings_'+ countries[i].iso_code +' WHERE kw = "'+ kws[k].kw +'" AND date = "'+ last_date.toISOString().split('T')[0] +'" AND url LIKE "https://'+ companies[j].url +'/%"')
                        console.log('SELECT rank FROM rankings_'+ countries[i].iso_code +' WHERE kw = "'+ kws[k].kw +'" AND date = "'+last_date.toISOString().split('T')[0] +'" AND url LIKE "https://'+ companies[j].url +'/%"')
                        let [sum1] = await pool.query('SELECT volume_search FROM kws_'+ countries[i].iso_code + ' WHERE kw = "'+ kws[k].kw +'"')
                        let search_vol_micro_kw = sum1[0].volume_search
                        //console.log(search_vol_micro)
                        //console.log('SELECT SUM(volume_search) as suma FROM kws_'+ countries[i].iso_code + ' WHERE kw = "'+ kws[k].kw +'"')
                        if(rank.length>0){
                            //console.log(((100/rank[0].rank)*(search_vol_micro_kw/search_vol_micro)))
                            suma += ((100/rank[0].rank)*(search_vol_micro_kw/search_vol_micro).toFixed(2))
                        } else {
                            continue
                        }
                    }
                    console.log(suma.toFixed(2))
                    if(keywords[l] == '%'){
                        entry[companies[j].nombre + '_todo'] = parseFloat(suma.toFixed(2))
                    } else {
                        entry[companies[j].nombre + '_' + keywords[l]] = parseFloat(suma.toFixed(2))
                    }
                }
            }
            entry['fecha'] = last_date.toISOString().split('T')[0]
            console.log(entry)
            let [result] = await pool.query('INSERT INTO visibilidad_'+ countries[i].iso_code +' SET ?', entry)
            console.log(result)
            last_date.setDate(last_date.getDate() + 1)
        }

        console.log('DONE')
        last

        last_date = new Date(last[0].last)
        last_date.setDate(last_date.getDate() + 1)
    }

}

update()