process.env.NTBA_FIX_319 = 1;

const TelegramBot = require('node-telegram-bot-api');
const cheerio = require('cheerio');
const axios = require('axios');
const CronJob = require('cron').CronJob;

const token = '971356082:AAGvlCJmk8p9Z4Won12LpYFMkJmiq4pnDrA';
const bot = new TelegramBot(token, {polling: true});

const url = `https://suchen.mobile.de/fahrzeuge/search.html?damageUnrepaired=NO_DAMAGE_UNREPAIRED&daysAfterCreation=1&emissionClass=EURO5&grossPrice=false&isSearchRequest=true&makeModelVariant1.makeId=25100&minFirstRegistrationDate=2007&pageNumber=1&scopeId=STT&sortOption.sortBy=creationTime&sortOption.sortOrder=DESCENDING`;
let carsArr = [],
    carsNewArr = [],
    photo,
    name,
    price,
    countNewCars = 0;

axios.get(url)
  .then(response => { 
    const body = response.data;
    const $ = cheerio.load(body);
    const resultList = $('.cBox--resultList').eq(1);
    let divResult = [];
          
    for (let i = 0; i < $('.cBox-body--resultitem', resultList).length; i++) {
      divResult.push($('.cBox-body--resultitem', resultList).eq(i));
      carsArr.push($('.result-item', divResult[i]));
    };
  })
  .catch(error => {
    console.log(error);
  })

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === '/start') {
    console.log(`cars on page = ${carsArr.length}`);
    bot.sendMessage(chatId, `Очікуйте! Як тільки новий товар буде доданий на сайт бот вам надішле повідомлення`);

    new CronJob('3,7,12,16,18,21,25,29,32,34,36,39,43,46,48,50,53,57,59 * * * * *', () => {
      axios.get(url)
        .then(response => { 
          const body = response.data;
          const $ = cheerio.load(body);
          const resultList = $('.cBox--resultList').eq(1);
          let divResult = [];

          divResult.push($('.cBox-body--resultitem', resultList).eq(0));
          if (carsArr[0].attr('data-ad-id') !== $('.result-item', divResult[0]).attr('data-ad-id')) {
            countNewCars++;
            carsArr.unshift($('.result-item', divResult[0]));
            carsArr.pop();
            carsNewArr.push($('.result-item', divResult[0]));
          }
          
          if (countNewCars) {
            for (let i = 0; i < countNewCars; i++) {
              photo = $(carsNewArr[i]).children('.g-row').children('.g-col-3').children('.image-block').children('.img-responsive').attr('src');
              name = $(carsNewArr[i]).children('.g-row').children('.g-col-9').children('.g-row').children('.g-col-8').children('.headline-block').children('.h3').text();
              price = $(carsNewArr[i]).children('.g-row').children('.g-col-9').children('.g-row').children('.g-col-4').children('.price-block').children('.h3').text();
              if (!(price.indexOf('€') + 1)) {
                carsArr.shift();
              } else {
                const noPhoto = `http://consaltliga.com.ua/wp-content/themes/consultix/images/no-image-found-360x250.png`;
                bot.sendPhoto(chatId, photo !== undefined ? `https:${photo.split('$')[0]}$_10.jpg` : noPhoto, {
                  caption: `${name}\n\nЦіна - ${price.split('(')[0]}`,
                  reply_markup: {
                    inline_keyboard: [
                      [
                        {
                          text: 'Купити',
                          url: carsNewArr[i].attr('href')
                        }
                      ]
                    ]
                  }
                });
              }
            }
            countNewCars = 0;
            carsNewArr = [];
          }      
          
        })
        .catch(error => {
          console.log(error);
        })

    }, null, true, 'Europe/Kiev');
  }

});
