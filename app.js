//gets the whole data from the city
const getVaccineData = async () => {
  let response = await axios.get('https://data.cityofchicago.org/resource/553k-3xzc.json')
  return response.data
}

//pulls data from each record for latest date and returns array
const updateData = (data) => {

  //iterates through the array return a object of unique zipcode:latest date pairs
  const findCurrentDate = (array) => {

    let datesByZip = {};
    array.forEach(element => {
      if (!datesByZip.hasOwnProperty(element.zip_code)) {
        datesByZip[element.zip_code] = element.date;
      } else {
        let date = new Date(element.date);
        if (date > datesByZip[element.zip_code]) {
          datesByZip[element.zip_code] = date;
        };
      };
    });

    //updates latest date indicator to DOM
    const upDate = document.querySelector('#up-date');
    lastUpdate = datesByZip[60601].slice(0, 10);
    const dateData = document.createTextNode(`Data last updated: ${lastUpdate}`);
    upDate.append(dateData);

    return (datesByZip);
  }

  //creates an array of chosen indicators for the latest date
  datesByZip = findCurrentDate(data);
  latestData = [];
  data.forEach(element => {
    let date = new Date(element.date);
    let zipDate = new Date(datesByZip[element.zip_code]);
    if (date.getTime() === zipDate.getTime()) {
      const objToAdd = {
        zip: element.zip_code,
        percentVaxd: `${Math.round(element.vaccine_series_completed_percent_population * 1000) / 10}%`,
        pop: element.population,
        percentFirstDosed: `${Math.round(element._1st_dose_percent_population * 1000) / 10}%`,
        dosesYesterday: element.total_doses_daily,
        peopleVaxd: element.vaccine_series_completed_cumulative,
        peopleFirstDosed: element._1st_dose_cumulative
      };
      latestData.push(objToAdd);
    };
  });

  return latestData;
}

//tear down and rebuild, brick by brick - row by row
const generateTable = (array) => {
  const table = document.querySelector('.table');
  while (table.querySelector('.table-row:nth-of-type(2)')) {
    table.lastChild.remove();
  }
  array.forEach(element => {
    const row = document.createElement('div');
    row.classList.add('table-row', 'observation');
    row.addEventListener('click', expandRow);
    for (key in element) {

      const cell = document.createElement('div');
      cell.classList.add('cell', key);
      const data = document.createTextNode(element[key]);
      cell.append(data);
      row.append(cell);
    }
    table.append(row);
  });
};

//appends ot DOM from array of objects of selected indicators  
const appendData = (latestData) => {
  //generates summary statistics
  let totalChiPop = 0;
  let totalPopVaxd = 0;
  let totalPeopleVaxd = 0;
  let totalDosesYesterday = 0;
  let totalFirstDosed = 0;
  latestData.forEach(element => {
    totalChiPop += Number(element.pop);
    totalPopVaxd += (element.pop * element.percentVaxd);
    totalPeopleVaxd += Number(element.peopleVaxd);
    totalDosesYesterday += Number(element.dosesYesterday);
    totalFirstDosed += (Number(element.peopleFirstDosed));
  });
  const totalVaxd = totalPeopleVaxd / totalChiPop;

  const summaryStats = {
    zip: "all",
    percentVaxd: `${Math.round(totalVaxd * 1000) / 10}%`,
    pop: totalChiPop,
    percentFirstDosed: `${Math.round((totalFirstDosed / totalChiPop) * 1000) / 10}%`,
    dosesYesterday: totalDosesYesterday,
    peopleVaxd: totalPeopleVaxd,
    peopleFirstDosed: totalFirstDosed
  };
  //append summary stats to pos 0 of array
  latestData.splice(0, 0, summaryStats);

  //make big %
  const bigNumber = document.createTextNode(`${Math.round(totalVaxd * 1000) / 10}%`);
  const fckCovid = document.querySelector(".fck-covid");
  fckCovid.append(bigNumber);


  //function sourced from
  //https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  //make big ratio display
  const bigRatio = document.createTextNode(`${numberWithCommas(totalPeopleVaxd)} people out of ${numberWithCommas(totalChiPop)} total`);
  const ratioContainer = document.querySelector('.big-ratio');
  ratioContainer.append(bigRatio);

  //does this
  generateTable(latestData);
}

getVaccineData()
  .then(response => appendData(updateData(response)));


//search function eliminates non-matching zips on keyup
const searchPlease = () => {
  let input = document.querySelector('#searchbar').value;
  let rows = document.querySelectorAll('.observation')
  rows.forEach(element => {
    if (!element.firstChild.innerText.includes(input)) {
      element.style.display = 'none';
    } else {
      element.style.display = 'flex';
    }

  });
}
const searchButton = document.querySelector('#searchbar');
searchButton.addEventListener('keyup', searchPlease);

//header cells WILL reorder divs
const reOrder = (e) => {
  unExpand();
  const rows = document.querySelectorAll('.table-row.observation');
  //rows become an array of objects to sort
  let rowsArray = Array.from(rows, row => {
    let rObj = {};
    row.childNodes.forEach(child => {
      rObj[child.classList[1]] = child.innerText;
    });
    return rObj;
  });
  //parse for sorting
  rowsArray.forEach(row => {
    row.percentVaxd = row.percentVaxd.replace('%', '');
    row.percentFirstDosed = row.percentFirstDosed.replace('%', '');
    row.zip = row.zip.replace('all', '111');
    row.zip = row.zip.replace('Unknown', '222');
  });
  //clone
  const origArray = [...rowsArray];
  //sort rows array on clicked stat
  const stat = e.target.classList[1];
  rowsArray.sort((a, b) => {
    if (Number(a[stat]) < Number(b[stat])) {
      return -1;
    }
    if (Number(a[stat]) > Number(b[stat])) {
      return 1;
    } else {
      return 0;
    }
  });
  //compares to cloned original to reverse if already sorted
  if (rowsArray[0] === origArray[0]) {
    rowsArray.sort((b, a) => {
      if (Number(a[stat]) < Number(b[stat])) {
        return -1;
      }
      if (Number(a[stat]) > Number(b[stat])) {
        return 1;
      } else {
        return 0;
      }
    });
  };

  //unparse
  rowsArray.forEach(row => {
    row.percentVaxd += '%';
    row.percentFirstDosed += '%';
    row.zip = row.zip.replace('111', 'all');
    row.zip = row.zip.replace('222', 'Unknown');
  });
  //rebuild table
  generateTable(rowsArray);
}

//adds sort functionality to to header cells
const headerCells = document.querySelectorAll('.table-row.header .cell');
headerCells.forEach(cell => cell.addEventListener('click', reOrder));

//unexpander
const unExpand = () => {
  document.querySelectorAll('.expanded').forEach(thing => thing.classList.remove('expanded'));
  document.querySelectorAll('.expanded-cell').forEach(thing => thing.remove());
}

//row expander
const expandRow = (e) => {
  if (e.target.classList.contains('cell')) {
    unExpand();
    e.target.parentNode.classList.add('expanded');
    e.target.parentNode.childNodes.forEach(child => {
      const cell = document.createElement('div');
      cell.classList.add('expanded-cell');
      const key = {
        zip: 'zip code',
        percentVaxd: '% vaccinated',
        pop: 'population',
        percentFirstDosed: '% received first dose',
        dosesYesterday: 'doses given yesterday',
        peopleVaxd: 'total vaccinated',
        peopleFirstDosed: 'total received first dose'
      };
      const content = document.createTextNode(`${key[child.classList[1]]} : ${child.innerText}`);
      e.target.parentNode.append(cell);
      cell.append(content);
    });
  }
};