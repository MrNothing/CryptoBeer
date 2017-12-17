var trackers = [
	//{name:"Bitcoin", symbol:"BTC", date:123456789, usd_value:19000, amount:0.01, icon:""}
]

var selectedTracker = 0;

var prices = null;

window.onload = function(){

	if (localStorage.getItem("trackers") != null)
	{
		trackers = JSON.parse(localStorage.getItem("trackers"))
		console.log("trackers: "+trackers.length);
	}

	refresh();
	initGraph();
	initGraph2();
	getPrices();
}

function refresh()
{
	updateNavList();
	if(trackers.length>0)
	{
		console.log("Showing trackers!")
		getPrices();
		selectTracker(selectedTracker)
		document.getElementById("welcome").style.display = "none";
	}
	else
	{
		document.getElementById("welcome").style.display = "block";
		console.log("No trackers were found!")
	}
}

setInterval(loop, 60*1000*2);
function loop()
{
	console.log("updating prices...");
	getPrices();
}

$( function() {
	$( "#datepicker" ).datepicker({uiLibrary: 'bootstrap4'});
} );

function updateNavList()
{
	var content = "";
	for (var i in trackers)
	{
		var style = "";
		var icon = "fa fa-circle-o";
		var d = "";
		var e = "";

		if (selectedTracker==i)
		{
			style = "background-color:white";
			icon = "fa fa-dot-circle-o";
			d = '<i onClick="deleteIndex('+i+')" class="fa fa-trash-o"></i> ';
			e = '<i onClick="editIndex('+i+')" class="fa fa-cog"></i> ';
		}

		var tracker = trackers[i];
		var infos = getCurrencyInfos(tracker.symbol);

		content+='<li class="nav-item" style="'+style+'" data-toggle="tooltip" data-placement="right" title="Charts">'
        content+='<a class="nav-link" onClick="selectTracker('+i+')">'
        content+='<i class="'+icon+'"></i>'
        if(infos)
        	content+='<span class="nav-link-text"> '+tracker.name+' '+Math.round(tracker.amount*infos.price_usd*10)/10+'$ '+d+e+'</span>'
       	else
        	content+='<span class="nav-link-text"> '+tracker.name+' '+d+e+'</span>'

        content+='</a>';
        content+='</li>';

	}

	if(trackers.length>0)
	{
		var style = "";
		if (selectedTracker==-1)
		{
			style = "background-color:white";
		}

		content+='<li class="nav-item" style="'+style+'" data-toggle="tooltip" data-placement="right" title="Charts">'
        content+='<a class="nav-link" onClick="selectTracker(-1)">'
	    content+='<i class="fa fa-binoculars"></i>'
	    content+='<span class="nav-link-text"> Total</span>'
	    content+='</a>'
	    content+='</li>'
	}
	
	content+='<li class="nav-item" data-toggle="tooltip" data-placement="right" title="Charts">'
    content+='<a class="nav-link" onClick="toggleAddTracker()">'
    content+='<i class="fa fa-fw fa-plus"></i>'
    content+='<span class="nav-link-text">Add new tracker</span>'
    content+='</a>'
    content+='</li>'

	document.getElementById("nav_list").innerHTML = content;
}

function selectTracker(id)
{
	tickerValues = []
	tickerLabels = []

	selectedTracker = id;

	if (id>=0)
	{
		getPrices();
		updatePage(id);
	}
	else
	{
		updateTotalPage();
	}

	document.getElementById("welcome").style.display = "none";
	updateNavList();
}

function deleteIndex(i)
{
	trackers.splice(i, 1);
	localStorage.setItem("trackers", JSON.stringify(trackers))
	refresh();
}

function updateTotalPage()
{
	document.getElementById("amountinfo").innerHTML = '<i class="fa fa-binoculars"></i>Total: ';
	document.getElementById("amountinfo").style.color = "";
	var gains = getTotalGains();
	gains = Math.round(gains*1000)/1000;
	if (gains>0)
	{

		document.getElementById("gaininfo").innerHTML = '+'+gains+"$";
		document.getElementById("gaininfo").style.color = "#00DD00";
	}
	else
	{
		document.getElementById("gaininfo").innerHTML = gains+"$";
		document.getElementById("gaininfo").style.color = "#DD0000";
	}
	document.getElementById("myChart").style.display = "block";
	document.getElementById("myChart2").style.display = "none";
	updateGraph();		
}

function updatePage(id)
{		

	document.getElementById("myChart").style.display = "none";
	document.getElementById("myChart2").style.display = "block";

	var tracker = trackers[id];

	if (prices==null)
	{
		document.getElementById("amountinfo").innerHTML = "Loading...";	
	}
	else
	{
		infos = getCurrencyInfos(tracker.symbol);

		document.getElementById("amountinfo").innerHTML = "Amount: "+tracker.amount+" "+tracker.symbol+"<br/> rate: "+infos.price_usd+" $"+"  "+infos.price_btc+" btc";	
		document.getElementById("amountinfo").style.color = "";

		var percent = Math.round(((tracker.amount*infos.price_usd)/tracker.init_usd_value)*100)-100;
		var gain = Math.round((tracker.amount*infos.price_usd-tracker.init_usd_value)*100)/100;
		if (gain>=0)
		{
			document.getElementById("gaininfo").innerHTML = "+"+gain+" $ (+"+percent+"%)";	
			document.getElementById("gaininfo").style.color = "#00DD00"
		}
		else
		{			
			document.getElementById("gaininfo").innerHTML = ""+gain+" $ ("+percent+"%)";
			document.getElementById("gaininfo").style.color = "#FF0000"

		}	

	}
}

function getPrices() {
	var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
        {
            prices = JSON.parse(xmlHttp.responseText);
        	if (selectedTracker>=0)
			{
				updatePage(selectedTracker);
				getHistorical();
			}
			else
			{
				updateTotalPage();
			}
			updateNavList();
        }
    }
    xmlHttp.open("GET", "https://api.coinmarketcap.com/v1/ticker/", true); // true for asynchronous 
    xmlHttp.send(null);
}

function getCurrencyInfos(symbol)
{
	for (var i in prices)
	{
		if(prices[i].symbol==symbol)
		{
			return prices[i];
		}
	}
}

function toggleAddTracker()
{
	$("#addModal").modal("show")
}

function addTracker()
{
	if(prices==null)
	{
		alert("could not retrieve currency data from coinmarketcap.com!")
	}
	else
	{
		var symbol = document.getElementById("currency").value;
		var amount = parseFloat(document.getElementById("amountfield").value);
		var infos = getCurrencyInfos(symbol);
		if (infos)
		{
			trackers.push({
				name:infos.name,
				symbol:infos.symbol,
				init_usd_value:amount*infos.price_usd,
				amount:amount
			});

			var id = trackers.length-1;

			localStorage.setItem("trackers", JSON.stringify(trackers));

			$("#addModal").modal("hide")
			selectTracker(trackers.length-1);

		}
		else
		{
			alert("Currency was not found: "+symbol);
		}
	}
}

var editingIndex;
function editIndex(id)
{
	editingIndex = id;
	$("#editModal").modal("show");
	document.getElementById("editcurrency").value = trackers[editingIndex].symbol;
	document.getElementById("editamountfield").value = trackers[editingIndex].amount;
	document.getElementById("editinitamountfield").value = trackers[editingIndex].init_usd_value;
}

function saveTracker()
{
	amount = parseFloat(document.getElementById("editamountfield").value);
	init_value = parseFloat(document.getElementById("editinitamountfield").value);
	trackers[editingIndex].amount = amount;
	trackers[editingIndex].init_usd_value = init_value;
	
	localStorage.setItem("trackers", JSON.stringify(trackers))

	selectTracker(editingIndex);
	$("#editModal").modal("hide")
}

var myChart;

function initGraph()
{
	var ctx = document.getElementById("myChart");
	document.getElementById("myChart").style.display = "none";
	myChart = new Chart(ctx, {
	    type: 'bar',
	    data: {
	        labels: [],
	        datasets: [{
	            label: 'Gains',
	            data: [],
	           
	            borderWidth: 1
	        }]
	    },
	    options: {
	        scales: {
	            yAxes: [{
	                ticks: {
	                    beginAtZero:true
	                }
	            }]
	        }
	    }
	});
}

var myChart2;
function initGraph2()
{
	var ctx = document.getElementById("myChart2");
	document.getElementById("myChart2").style.display = "none";
	myChart2 = new Chart(ctx, {
	    type: 'line',
	    data: {
	        labels: [],
	        datasets: [{
	            label: 'Unit price (BTC)',
	            data: [],
	           
	            borderWidth: 1
	        }]
	    },
	    options: {
	       
	    }
	});
}

function getTotalGains()
{
	var sum = 0;
	for (var i in trackers)
	{
		var tracker = trackers[i];
		var infos = getCurrencyInfos(tracker.symbol);
		var gain = tracker.amount*infos.price_usd-tracker.init_usd_value;
		sum+=gain;
	}

	return sum;
}

function updateGraph()
{
	var labels = [];
	var values = [];

	var sum = 0;
	for (var i in trackers)
	{
		var tracker = trackers[i];
		var infos = getCurrencyInfos(tracker.symbol);
		var gain = tracker.amount*infos.price_usd-tracker.init_usd_value;
		labels.push(tracker.name)
		values.push(gain) 
		sum+=gain;
	}

	labels.push("Total")
	values.push(sum) //todo, get real price in $

	var data = {
	        labels: labels,
	        datasets: [{
	            label: 'Value in $',
	            data: values,
	            backgroundColor: [
	                'rgba(255, 99, 132, 0.2)',
	                'rgba(54, 162, 235, 0.2)',
	                'rgba(255, 206, 86, 0.2)',
	                'rgba(75, 192, 192, 0.2)',
	                'rgba(153, 102, 255, 0.2)',
	                'rgba(255, 159, 64, 0.2)'
	            ],
	            borderColor: [
	                'rgba(255,99,132,1)',
	                'rgba(54, 162, 235, 1)',
	                'rgba(255, 206, 86, 1)',
	                'rgba(75, 192, 192, 1)',
	                'rgba(153, 102, 255, 1)',
	                'rgba(255, 159, 64, 1)'
	            ],
	            borderWidth: 1
	        }]
	    };
	myChart.data = data;
	myChart.update();
	console.log("Updating total graph sum: "+sum)
}

function getHistorical() {
	var xmlHttp = new XMLHttpRequest();
	var infos = getCurrencyInfos(trackers[selectedTracker].symbol);

	if (infos)
	{
		 xmlHttp.onreadystatechange = function() { 
	        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
	        {
	            var ticks = JSON.parse(xmlHttp.responseText);

	        	updateTickerGraph(ticks)
	        }
	    }

	    var endDate = (new Date()).getTime();
	    var startDate = (new Date()).getTime()-60*60*24;

	    //xmlHttp.open("GET", "https://www.binance.com/api/v1/klines?symbol="+infos.symbol+"BTC&interval=1m", true); // true for asynchronous 
	    xmlHttp.open("GET", "https://api.kraken.com/0/public/Trades?pair=XBTEUR", true); // true for asynchronous 
	    xmlHttp.send(null);
	}

   	updateTickerGraph()
}

var ticker_map = {}

function updateTickerGraph()
{	
	for (var i in trackers)
	{
		if(!ticker_map[i])
		ticker_map[i] = {values:[], labels:[]};

		var tickerValues = ticker_map[i].values;
		var tickerLabels = ticker_map[i].labels;

		var tracker = trackers[i];
		var infos = getCurrencyInfos(tracker.symbol);

		tickerLabels.push((new Date()).getTime());
		tickerValues.push(infos.price_usd); 
	}

	var tickerValues = ticker_map[selectedTracker].values;
	var tickerLabels = ticker_map[selectedTracker].labels;

	var data = {
	        labels: tickerLabels,
	        datasets: [{
	            label: 'Value per unit ($)',
	            data: tickerValues,
	            borderWidth: 1
	        }]
	    };
	myChart2.data = data;
	myChart2.update(0);	
}