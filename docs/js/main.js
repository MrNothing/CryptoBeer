var trackers = [
	//{name:"Bitcoin", symbol:"BTC", date:123456789, usd_value:19000, amount:0.01, icon:""}
]

var selectedTracker = 0;

var prices = null;

window.onload = function(){
	var counter = 0;
	while (localStorage.getItem("name"+counter) != null) {
	  trackers.push({
			name:localStorage.getItem("name"+counter),
			symbol:localStorage.getItem("symbol"+counter),
			init_usd_value:localStorage.getItem("init_usd_value"+counter),
			amount:localStorage.getItem("amount"+counter)
		});
	  counter++;
	}

	refresh();
	initGraph();
}

function refresh()
{
	updateNavList();
	selectTracker(selectedTracker)
	if(trackers.length>0)
	{
		console.log("Showing trackers!")
		getPrices();
		document.getElementById("welcome").style.display = "none";
	}
	else
	{
		document.getElementById("welcome").style.display = "block";
		console.log("No trackers were found!")
	}
}

setInterval(loop, 15000);
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
		content+='<li class="nav-item" style="'+style+'" data-toggle="tooltip" data-placement="right" title="Charts">'
        content+='<a class="nav-link" onClick="selectTracker('+i+')">'
        content+='<i class="'+icon+'"></i>'
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
	localStorage.removeItem("name"+i);
	localStorage.removeItem("symbol"+i);
	localStorage.removeItem("init_usd_value"+i);
	localStorage.removeItem("amount"+i);
	refresh();
}

function updateTotalPage()
{
	document.getElementById("gaininfo").innerHTML = "";
	var gains = getTotalGains();
	if (gains>0)
	{

		document.getElementById("amountinfo").innerHTML = '<i class="fa fa-binoculars"></i> Total: +'+gains+"$";
		document.getElementById("amountinfo").style.color = "00DD00";
	}
	else
	{
		document.getElementById("amountinfo").innerHTML = '<i class="fa fa-binoculars"></i> Total: '+gains+"$";
		document.getElementById("amountinfo").style.color = "DD0000";
	}
	updateGraph();		
	document.getElementById("myChart").style.display = "block";
}

function updatePage(id)
{		
	document.getElementById("myChart").style.display = "none";

	var tracker = trackers[id];

	if (prices==null)
	{
		document.getElementById("amountinfo").innerHTML = "Loading...";	
	}
	else
	{
		infos = getCurrencyInfos(tracker.symbol);

		document.getElementById("amountinfo").innerHTML = "Amount: "+tracker.amount+" "+tracker.symbol+"<br/> rate: "+infos.price_usd+" $";	
		document.getElementById("amountinfo").style.color = "";

		var percent = Math.round(((tracker.amount*infos.price_usd)/tracker.init_usd_value)*100)-100;
		var gain = Math.round((tracker.amount*infos.price_usd-tracker.init_usd_value)*100)/100;
		if (percent>=0)
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
        	selectTracker(selectedTracker)
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

			localStorage.setItem("name"+id, infos.name);
			localStorage.setItem("symbol"+id, infos.symbol);
			localStorage.setItem("init_usd_value"+id, amount*infos.price_usd);
			localStorage.setItem("amount"+id, amount);

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
	localStorage.setItem("init_usd_value"+editingIndex, init_value);
	localStorage.setItem("amount"+editingIndex, amount);
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
	            label: '# of Votes',
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
	
}

tickerValues = []
tickerLabels = []

function getTick() {
	var xmlHttp = new XMLHttpRequest();
	var infos = getCurrencyInfos(trackers[selectedTracker].symbol);
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
        {
            var tick = JSON.parse(xmlHttp.responseText);

        	updateTickerGraph()
        }
    }
    xmlHttp.open("GET", "https://api.coinmarketcap.com/v1/ticker/"+infos.id, true); // true for asynchronous 
    xmlHttp.send(null);
}

function updateTickerGraph()
{
	var sum = 0;
	for (var i in trackers)
	{
		var tracker = trackers[i];
		var infos = getCurrencyInfos(tracker.symbol);
		labels.push(tracker.name)
		values.push(tracker.amount*infos.price_usd) 
		sum+=tracker.amount*infos.price_usd;
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
	
}