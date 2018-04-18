const axios = require('axios');

const express = require('express');
const app = express();


//serves index.html from public folder when hitting "base" route
// app.use(express.static('public'));

//process.env.PORT for deployment (heroku)
//falls back to 3000 for development
const port = process.env.PORT || 3000;

const about = {
    server: {
        name: 'Common Microservice API for A Song of Ice and Fire',
        apiVersion: '1.0'
    },
    availableDataSeries: {
        books: {
            name: 'Books',
            description: 'Information about the main 5 books that take place in the A Song of Ice and Fire universe created by George R.R. Martin',
        },
        povcharacters: {
            name: 'POV Characters',
            description: 'Returns a list of characters inside the A Song of Ice and Fire universe that have chapters told from their point-of-view'
        },
        houses: {
            name: 'Houses and Words',
            description: 'Information about the various houses inside the A Song of Ice and Fire universe'
        }
    }
}

app.get('/', (req, res) => {
  res.status(200).send(about);
});

//send a list of available API endpoints
app.get('/api', (req, res) => {
  res.status(200).send(about.availableDataSeries);
});

app.get('/api/books', (req, res) => {
  const output = [];
  axios.get('https://www.anapioficeandfire.com/api/books/')
  .then((response) => {
    for (let book of response.data) {
      let bookObj = { title: book.name, author: book.authors[0], releaseDate: book.released }
      output.push(bookObj);
    }
  })

  //timeout to give requests time to complete
  setTimeout(() => {
    res.status(200).send({
      format: 'JSON',
      initialDataSet: output
    });
  }, 2000)
});

//would definitely like to modularize / take parts out of this request
app.get('/api/povcharacters', (req, res) => {
  let characterLinks = [];
  let ids = [];
  const output = [];

  // 5 books in series
  for (let i=1; i<=5; i++) {
    axios.get(`https://www.anapioficeandfire.com/api/books/${i}`)
    .then(res => {
      //get each character that has a pov
      characterLinks = [...characterLinks, ...res.data.povCharacters];
    })
    .then(() => {
      characterLinks.forEach(char => {
        //get id number only (regex matching digits)
        char = char.match(/(\d)+/g);
        ids.push(char[0]);
      })
      //remove duplicates
      ids = [...new Set(ids)];
      ids.forEach(id => {
        axios.get(`https://anapioficeandfire.com/api/characters/${id}`)
        .then(resp => {
          output.push({ name: resp.data.name, url: 'https://anapioficeandfire.com/api/characters/' + id})
          // was thinking about name as key and url as value
          // [resp.data.name] = 'https://anapioficeandfire.com/api/characters/' + char[0];
        })
      })
    })

  }
  //to give the requests time to complete
  setTimeout(() => {
    res.status(200).send({
      format: 'JSON',
      initialDataSet: output
    });
  }, 3000)
});

app.get('/api/houses', (req, res) => {
  let output = [];

  //manually found out that there are 444 houses ("binary search" ;) )
  for (let i=1; i<=444; i++) {
    axios.get(`https://anapioficeandfire.com/api/houses/${i}`)
    .then(res => {
      console.log(res);
      output.push({ name: res.data.name, houseWords: res.data.words });
    })
  }
  //10 seconds because there's a lot of requests
  setTimeout(() => {
    res.status(200).send({
      format: 'JSON',
      initialDataSet: output
    });
  }, 10000)
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

module.exports = app;
