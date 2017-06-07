const fs = require('fs')
const fetch = require('node-fetch');
const moment = require('moment');

const storeFilePath = './public/store.json';

const CHANGE_THRESHOLD = 1.05; // 5%

fetch('https://bittrex.com/api/v1.1/public/getmarketsummaries')
	.then((response) => {
		return response.json();
	})

	.then((result) => {
		const markets = result.result;
		const store = JSON.parse(fs.readFileSync(storeFilePath));

		// Remove old intruders
		store.intruders = store.intruders.filter((intruder) => {
			return moment().diff(moment(intruder.timestamp), 'hours') < 12;
		})

		const addIntruder = (intruder) => {
			store.intruders = store.intruders.filter((item) => {
				return item.market.id != intruder.id
			});

			store.intruders.unshift(intruder);
		}

		const newStore = {
			lastUpdate: moment().format(),
			markets: {},
			intruders: []
		}

		// Check for new intruders
		markets.forEach((market) => {
			const id = market.MarketName;
			const storedMarketRecord = store.markets[id];

			const marketRecord = newStore.markets[id] = {
				id: id,
				last: market.Last,
			}

			if (storedMarketRecord) {
				const change = marketRecord.last / storedMarketRecord.last

				console.log(marketRecord.id, change);

				if (change > CHANGE_THRESHOLD) {
					addIntruder({
						market: marketRecord,
						change: change,
						timestamp: moment().format()
					})
				}
			}
		});

		newStore.intruders = store.intruders;

		const output = JSON.stringify(newStore, null, '\t');

		fs.writeFileSync(storeFilePath, output);
	});



