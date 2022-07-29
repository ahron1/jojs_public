
	// todo
	//todo - make vars for all html elements used in js via getElementById
	//todo - consider separate req (and server route) to check for login status. route for actual login/pageload could already send image list. 
	//todo - consider using session storage, to retain vars after page refresh
	//enter image id in url - client + server
	//desc
	//clicking on next: 
	//	when it is a votable image (identified by non existence in the votedimages list): show the next item in the votable list, and register the vote. 
	//	when it is a non votable image (identified by existence in the votedimages list): show the next item in the votable list, do not register the vote

	//clicking on a vote button:
	//	when it is a votable image (identified by non existence in the votedimages list): register the vote, and show the next item in the votable list
	//	when it is a non votable image: vote buttons are deactivated. 

	//global variables 
	var fp; // fingerprint

	var file;
	var homeurl = "/";
	var contacturl = "/contact";
	var uploadurl = "/upload";

	var Y;
	var batchsize = 5; //number of pics/votes to get/send in a lot

	var image_counter; //start at 0, inc each time a new image is voted on, not for revisited images. only increases. 
	var current_n; // used to denote the sequence number (in the array) of the image currently on display. increases and decreases. 

	var voterecord;
	var votedimages;

	var voted_images_id_list;
	var voted_adj1_list;
	var voted_adj2_list;
	var voted_choice_list;
	var voted_list;
	
	var images_src_list;
	var images_id_list;
	var image_titles_list;
	var image_adj1_list;
	var image_adj1_id_list;
	var image_adj2_list;
	var image_adj2_id_list;
	var images_src_list_length;
	var image_titles_list_length;

	function reset_image_vars(){
		image_counter = 0; //start at 0, inc each time a new image is voted on, not for revisited images. only increases. 
		current_n; // used to denote the sequence number (in the array) of the image currently on display. increases and decreases. 

		voterecord = [];
		votedimages = [];

		voted_images_id_list = [];
		voted_adj1_list = [];
		voted_adj2_list = [];
		voted_choice_list = [];
		voted_list = {"images":voted_images_id_list,"adj1":voted_adj1_list,"adj2":voted_adj2_list,"choice":voted_choice_list};
		
		images_src_list = [];
		images_id_list = [];
		image_titles_list = ["ddd", "foo", "bar", "baz", "fab"];
		image_adj1_list = [];
		image_adj1_id_list = [];
		image_adj2_list = [];
		image_adj2_id_list = [];
		images_src_list_length = images_src_list.length;
		image_titles_list_length = image_titles_list.length;
	}
	reset_image_vars();

	/// event listeners - domcontentloaded, popstate, preview image for upload
	document.addEventListener("DOMContentLoaded", function(event) { 
		on_page_load();
	});
	window.onpopstate = function(event) {
		event.preventDefault();
		wait_and_scroll_up(50);
		if ((event.state === null) ) {
			//if the user has clicked the back button all the way to the start where there's no history and hence event.state is null
			//window.location.href="https://192.168.43.220:8765"; //reload the page to bring user back to same place. this is suboptimal. approach below works much better. 
			history.go(1); //just keep on same page if user keeps clicking back button, since there's no back. 
		} else {
			var popped_url = event.state.url;
			js_routing_hist(popped_url);
		}
	//	js_routing(window.location.pathname);
	}
	//show preview of image to be uploaded
	document.addEventListener('DOMContentLoaded',function() {
		document.querySelector('#userinputfile').addEventListener('change', function(){
			file = this.files[0];
			var reader = new FileReader();
			reader.onload = function(e){
				document.querySelector('#imagetoupload').src = e.target.result
			};
			reader.readAsDataURL(file);
		}, false)}, false);

	/// js routing
	function js_routing(path){
		switch(path) {
			case "/upload": 
				//console.log("upload");
				console.log(path);
				show_upload_form();
				break;
			case "/contact": 
				console.log(path);
				show_contact_form();
				break;
			case "/infinite":  //js_routing_hist probably doesnt need this. 
				//console.log("upload");
				console.log(path);
				get_new_images(path);
				show_image_voting();
				break;
			case (path.match(/[0-9]+$/) || {}).input: 
				//get image Id from the url form /images/xxxx

				console.log(path);
				get_new_images(path);
				//send req to server. receive array/list in response. 
				//key difference between this route in js_routing/hist - load from server vs load from existing array. 
				//load_image_n(1);
				show_image_voting();
				break;
			default:
				//console.log("default. loading home");
				console.log(path);
				show_home_page();
				//get_new_images(path);
				//show_image_voting();
		}
	}
	function js_routing_hist(path){
		switch(path) {
			case "/upload": 
				//console.log("upload history");
				show_upload_form_hist();
				break;
			case "/contact": 
				//console.log("contact history");
				show_contact_form_hist();
				break;
			// for matching images. the path will be the last segment (with image id)
			case (path.match(/[0-9]+$/) || {}).input: 
				//console.log("contact history");
				show_image_voting_hist();
				break;
			default:
				//console.log("default. loading home");
				 //window.location.href="https://192.168.64.2";
				 //window.location.href="https://jochoice.com";
				 window.location.href="/";
				//show_image_voting_histndow.location.href=\""();
		}
	}

	/// page structure
	function on_page_load() {
		// hide all the "below-fold" divs
		hide_below_fold();
		hide_image_voting();
		console.log("on_page_load called");
		fingerprint(); //this func involves a timeout, so calling it on page load ensures that the fp variable is already set for later use (e.g. sign_in)

		overlay_on();

//		overlay_off();
//		show_home_page();
////		var path = window.location.pathname;
////		get_new_images(path);
////		js_routing(path);
//		wait_and_scroll_up(50);


		//console.log(window.location.pathname);

		// send empty GET to check for cookies
		var xhr = new XMLHttpRequest;
		xhr.open('GET', "/login");
		xhr.onload = function() {
			if (xhr.status === 200) {
				//var path = window.location.pathname.substr(1);
				//call the js_routing fun to load the path submitted in the address bar
				var path = window.location.pathname;
				//get_new_images("");
				get_new_images(path);
				js_routing(path);
				overlay_off();
				wait_and_scroll_up(50);
				console.log("home page loaded ok");
			}
			else if (xhr.status !== 200) {
				overlay_on();
			}
		};
		xhr.send();
	}
	function overlay_on(){
		document.getElementById("overlay").style.display = "block";
		document.getElementById("sign-up-now-button").style.display = "none";
		document.getElementById("sign-up-text").style.display = "none";
	//	document.getElementById("sign-up-inviter").style.display = "none";
		document.getElementById("user-details").style.display = "none";
		document.getElementById("maincontents").classList.add('noscroll');
	//	document.getElementById("password_reset").style.display = "none";

		document.getElementById("contact-form-div-prelogin").style.display = "none";
		document.getElementById("show-contact-button-prelogin").style.display = "block";
		document.getElementById("contact-form-buttons-prelogin").style.display = "none";
	}
	function overlay_off(){
		document.getElementById("overlay").style.display = "none";
		document.getElementById("maincontents").classList.remove('noscroll');
		wait_and_scroll_up(50);
	}
	function hide_below_fold(){
		hide_contact_form();
		hide_upload_form();
	}
	function hide_bottom_buttons(){
		document.getElementById("bottom-buttons").style.display="none";
	}
	function show_home_page(){
		hide_upload_form();
		hide_contact_form();
		hide_image_voting();
		hide_below_fold();
		reset_image_vars();
		history.pushState({url:homeurl}, null, homeurl);
		history.pushState({url:homeurl}, null, homeurl); //yes, this is needed twice. otherwise back btn misbehaves after quit_slideshow
		document.getElementById("home-page").style.display = "block";
		wait_and_scroll_up(50);
	}
	function hide_home_page(){
		document.getElementById("home-page").style.display = "none";
	}

	/// login, pw, account related
	function clear_login_form(){
		document.getElementById("login-email").value="";
		document.getElementById("login-password").value="";
	//	document.getElementById("inviter-email").value="";
		document.getElementById("first-name").value="";
	}
	function sign_in() {
		var xhr = new XMLHttpRequest;
		xhr.open('POST', "/login");
		xhr.onload = function() {
			clear_login_form();
			//alert(this.response);
			if (xhr.status === 200) {
				//send new req to server to get images list. 
				overlay_off();

				var path = window.location.pathname;
				//get_new_images(path);
				js_routing(path);
				console.log(this.response);
			}
			else {
				clear_login_form();
				//alert('Request failed.  Returned status of ' + xhr.status);
				alert(this.response);
			}
		};

		//create json data variable from html text input elements 
		//var data = JSON.stringify({login:document.getElementById("login-email").value, password:document.getElementById("login-password").value});
		
		//create FormData variable and append values from html text input elements
		var data = new FormData();
		data.append("login-email", document.getElementById("login-email").value);
		data.append("login-password", document.getElementById("login-password").value);
		data.append("fingerprint", fp);
		console.log("sending login req. fp is " + fp);

		xhr.send(data);
	}
	function sign_out() {
		var xhr = new XMLHttpRequest;
		xhr.open('POST', "/logout");
		xhr.onload = function() {
			//alert(this.response);
			if (xhr.status === 200) {
				location.replace("/");
			}
			else {
				//alert('Request failed.  Returned status of ' + xhr.status);
			}
		};
		xhr.send();
	}
	function guest_entry(){
		alert('Welcome, dear guest. We have created a temporary account just for you. Please note that guests accounts have limited functionality. We hope you enjoy the app, and sign up for an account. It is free and fun!')
		sign_in();
	}
	function sign_up_now() {
		var xhr = new XMLHttpRequest;
		//sign up route can be "/join/new" (goes via confirmation/token email etc.) or "/join/spot" (instant signup and login)
		//also check join_handler and html (show/hide appropriate fields) and (in this js) append appropriate fields
		var sign_up_method = "spot"; //can be "new" or "spot"
		xhr.open('POST', "/join/" + sign_up_method);
		xhr.onload = function() {
			//alert(this.response);
			clear_login_form();
			if (xhr.status === 200) {
				if (sign_up_method == "spot"){
					overlay_off();
					var path = window.location.pathname;
					//get_new_images(path);
					js_routing(path);
					console.log(this.response);
					alert(xhr.responseText);
				} else if (sign_up_method = "new") {
					alert(xhr.responseText);
					location.reload(true);
					//overlay_off();
				}
			}
			else if (xhr.status !== 200) {
				//alert('Request failed.  Returned status of ' + xhr.status);
				alert(xhr.responseText);
				location.reload(true);
			}
		};
		var data = new FormData();
		data.append("login-email", document.getElementById("login-email").value);
		data.append("login-password", document.getElementById("login-password").value);
		data.append("first-name", document.getElementById("first-name").value);
		xhr.send(data);
	}
	function show_signup(){
		document.getElementById("sign-up-now-button").style.display = "block";
		//document.getElementById("sign-up-text").style.display = "block";
		document.getElementById("user-details").style.display = "block";
		document.getElementById("loginbutton").style.display = "none";
		document.getElementById("signup-button").style.display = "none";
		document.getElementById("no-account-text").style.display = "none";
		//document.getElementById("password-entry").style.display = "none";
	}
	function forgot_pw() {
		var xhr = new XMLHttpRequest;
		xhr.open('POST', "/password/forgot");
		xhr.onload = function() {
			if (xhr.status === 200) {
				//alert('Something went wrong.  Name is now ' + xhr.responseText);
				//alert('Something went wrong.  Name is now ' + xhr.statusText);
	//			overlay_off();
	//			var path = window.location.pathname;
	//			js_routing(path);
	//			alert("Request received successfully. Please check your email");
				alert(this.response);
				clear_login_form();
	//			document.getElementById("password_reset").style.display = "block";
	//			document.getElementById("entry").style.display = "none";
				
			}
			else {
				alert('Request failed.  Returned status of ' + xhr.status);
				clear_login_form();
			}
		};

		//create FormData variable and append values from html text input elements
		var data = new FormData();
		data.append("login-email", document.getElementById("login-email").value);
		data.append("login-password", document.getElementById("login-password").value)
		xhr.send(data);
	}

	/// image, voting related
	function start_slideshow(){
		get_new_images("/");
		show_image_voting();
	}
	function show_image_voting(){
		document.getElementById("image-voting").style.display = "block";
		load_image_n(image_counter); // start at 0
		hide_below_fold();
		hide_home_page();
		wait_and_scroll_up(50);
	}
	function show_image_voting_hist(){
		document.getElementById("image-voting").style.display = "block";
		hide_home_page();
		hide_upload_form();
		hide_contact_form();
		hide_below_fold();
		
		//load up corresponding image from array
		load_image_hist();
	}
	function hide_image_voting(){
		document.getElementById("image-voting").style.display = "none";
	}

	//original load_image_fun. works okay.
	//async function load_image_n(n) {
	//	document.getElementById("currentimage").src = images_src_list[n];
	//	document.getElementById("imagetitle").innerHTML = image_titles_list[n];
	//
	//	imagesbuttonsdeactivation();
	//	document.getElementById("button1").innerHTML = "...";
	//	document.getElementById("button2").innerHTML = "...";
	//	await sleep(2000);
	//	document.getElementById("button1").innerHTML = image_adj1_list[n];
	//	document.getElementById("button2").innerHTML = image_adj2_list[n];
	//
	//	imagesbuttonsactivation(n);
	//	createimagehistory(n);
	//}
	//alternative load_image_fun with img.onload. to load adjs with time delay.  
	function load_image_n(n) {
		document.getElementById("currentimage").src = images_src_list[n];
		document.getElementById("imagetitle").innerHTML = image_titles_list[n];

		imagesbuttonsdeactivation();
		document.getElementById("button1").innerHTML = "...";
		document.getElementById("button2").innerHTML = "...";

		createimagehistory(n);
		document.getElementById("currentimage").onload = async function(){ 
			await sleep(800);
			console.log("image loaded. updating adjectives. ");
			document.getElementById("button1").innerHTML = image_adj1_list[n];
			document.getElementById("button2").innerHTML = image_adj2_list[n];

			imagesbuttonsactivation(n);
		}
	}

	function load_image_hist() {
		//get serial number of that image in the array
		current_n = get_image_serial();
		imagesbuttonsactivation(current_n);

		document.getElementById("currentimage").src = images_src_list[current_n];
		document.getElementById("imagetitle").innerHTML = image_titles_list[current_n];
		document.getElementById("button1").innerHTML = image_adj1_list[current_n];
		document.getElementById("button2").innerHTML = image_adj2_list[current_n];

		//createimagehistory(n);
		//historical views don't push state to history because that leads to an infinite loop.
	}
	//function preload_images(src_array) {
	//	document.getElementById("preload1").src = src_array[1];
	//	document.getElementById("preload2").src = src_array[2];
	//	document.getElementById("preload3").src = src_array[3];
	//	document.getElementById("preload4").src = src_array[4];
	//}

	function nextimage(clickedbuttonid) {
		// img1 vote -> img 2 vote -> img 3 vote -> back -> back -> contact page -> back (to img 1) -> then click next
		// to do - click skip/next button on already voted image - take to next (voted) image or next image yet to be voted?
		// consider - checking (similar to imagesbuttonsactivation) before taking action on next click ??
		//
		// list of 10 images. when n is 2, update 6-10, when n is 7, update 1-5. 
		//
		// updating includes sending the votes for those images to the server (create new array to store vote results)
		// create server module to process votes and another to send new images. 
		// function to check for value of n and send votes to server and get/process/update new images
		//make_ajax_call(server);
		//function to simply update images_src_list with this.response. 

		current_n = get_image_serial();
		//document.getElementById("button1").disabled=true;
		recordvote(current_n, clickedbuttonid);

		// get new set of images after every 5th image
		// to do: send last 5 votes to server
		// check if counter is multiple of 5, since array starts at 0. 
		if ((image_counter + 1) % batchsize == 0) {
			get_new_images("");
			send_votes();
			if (image_counter > 10) {
				alert ("Hope you enjoyed the show. Thank you for voting!");
				show_home_page();
			}
		}

		load_image_n(image_counter);
		}
	function get_new_images(path){
	//req next (unseen) set of 5 images from server
		var xhr = new XMLHttpRequest;
		xhr.open('POST', "/getimages", false);
		xhr.onload = function() {
			if (xhr.status === 200) {
				//console.log(this.response);
				Y = this.response;
				console.log(Y);
				Z = JSON.parse(Y);
				console.log(Z.picid);

				console.log(Z.uri);
				//preload_images(Z.uri);

				images_id_list = images_id_list.concat(Z.picid);
				images_src_list = images_src_list.concat(Z.uri);
				image_adj1_list = image_adj1_list.concat(Z.adj1);
				image_adj1_id_list = image_adj1_id_list.concat(Z.adj1_id);
				image_adj2_list = image_adj2_list.concat(Z.adj2);
				image_adj2_id_list = image_adj2_id_list.concat(Z.adj2_id);
				
				console.log(images_id_list);
				console.log(images_src_list);
					}
			else if (xhr.status !== 200) {
				console.log(this.response);
					}
		};
		var data = new FormData();
		data.append("votes", path);
		xhr.send(data);
	}
	function createimagehistory(n){
		//if (n == 0) {
			history.pushState({url:homeurl+"images/"+images_id_list[n]}, null, homeurl+"images/"+images_id_list[n]);
		//} else {
			//history.pushState({url: images_id_list[n]}, null, images_id_list[n]);
		//}
	}

	function recordvote(current_n, clickedbuttonid){
		if (current_n == image_counter) {
			voted_images_id_list.push(images_id_list[image_counter]);
			voted_adj1_list.push(image_adj1_id_list[image_counter]);
			voted_adj2_list.push(image_adj2_id_list[image_counter]);
			voted_choice_list.push(clickedbuttonid);

			console.log(voted_list);

			voterecord[image_counter] = clickedbuttonid;
			//alert(voterecord);
			image_counter = image_counter + 1;
		}
	}
	function send_votes(){
		var xhr = new XMLHttpRequest;
		xhr.open('POST', "/sendvotes");
		xhr.onload = function() {
			if (xhr.status === 200) {
				console.log(this.response);
				reset_new_votes_list();
			}
			else if (xhr.status !== 200) {
				console.log(this.response);
			}
		};
		var data = new FormData();
		data.append("votes", JSON.stringify(voted_list));
		xhr.send(data);
	}
	function reset_new_votes_list(){
		voted_images_id_list.splice(0,batchsize);
		voted_adj1_list.splice(0,batchsize);
		voted_adj2_list.splice(0,batchsize);
		voted_choice_list.splice(0,batchsize);
	}

	function imagesbuttonsactivation(n){
		if (n < image_counter) {
			// to do: try using getelementbyclass instead of id
			document.getElementById("button1").disabled = true;
			document.getElementById("button2").disabled = true;
			//document.getElementById("button3").disabled = true;
		} else {
			document.getElementById("button1").disabled = false;
			document.getElementById("button2").disabled = false;
			//document.getElementById("button3").disabled = false;
		}
	}
	function imagesbuttonsdeactivation(){
			document.getElementById("button1").disabled = true;
			document.getElementById("button2").disabled = true;
	}

	function get_image_id_from_url(){
		//get image Id from the url form /images/xxxx
		patharray = window.location.pathname.split("/");
		if (patharray[1] == "images"){
			return patharray[2];
		}
	}
	function get_image_serial(){
		id = get_image_id_from_url();
		for (var i = images_id_list.length; i >= 0; i--) {
			if (id == images_id_list[i]){
				return i;
			}
		}

	}

	function liked(){
		alert("liked!");
		document.getElementById("hearticon").src = "includes/liked_green.png"
	}

	/// send message
	function show_contact_form(){
		//history.pushState({url:contacturl.substr(1)}, null, contacturl);
		history.pushState({url:contacturl}, null, contacturl);
		document.getElementById("show-upload-button").style.display = "none";
		document.getElementById("contact-form-div").style.display = "block";
		document.getElementById("show-contact-button").style.display = "none";
		document.getElementById("send-message-button-div").style.display = "block";
		document.getElementById("show-upload-and-contact-button-div").style.display = "none";
		hide_home_page();
		hide_upload_form();
		hide_image_voting();
		wait_and_scroll_up(50);
	}
	function show_contact_form_hist(){
		//history.pushState({url:contacturl.substr(1)}, null, contacturl);
		document.getElementById("show-upload-button").style.display = "none";
		document.getElementById("contact-form-div").style.display = "block";
		document.getElementById("show-contact-button").style.display = "none";
		document.getElementById("send-message-button-div").style.display = "block";
		document.getElementById("show-upload-and-contact-button-div").style.display = "none";
		hide_upload_form();
		hide_image_voting();
	}
	function hide_contact_form(){
		clear_contact_form();
		document.getElementById("contact-form-div").style.display = "none";
		document.getElementById("show-contact-button").style.display = "block";
		document.getElementById("send-message-button-div").style.display = "none";
		document.getElementById("show-upload-and-contact-button-div").style.display = "block";
	}
	function clear_contact_form(){
		document.getElementById("text-name").value="";
		document.getElementById("text-email").value="";
		document.getElementById("textarea-message").textContent="Hi there...";

	}
	function send_message() {
		var xhr = new XMLHttpRequest;
		xhr.open('POST', "/messagehandler");
		xhr.onload = function() {
			hide_contact_form();
			if (xhr.status === 200) {
				//document.getElementById("message-content").innerHTML=this.response;
				alert(this.response);
				window.history.go(-1);
				//window.history.go(+1);
			}
			else {
				//alert('Message sending failed.  Returned status of ' + xhr.status);
				alert('Message sending failed.  Returned status of ' + xhr.responseText);
			}

		};
		var data = new FormData();
		data.append("sender-name", document.getElementById("text-name").value);
		data.append("sender-email", document.getElementById("text-email").value)
		//the line below gets the content from a text box using .value
		//data.append("message-content", document.getElementById("textarea-message").value)
		//the line below gets the content from a adjustable content span using .innerhtml
		//the advantage of using a span is its size adjusts automatically to given input.
		//but a text box needs jquery for its size to adjust to input
		data.append("message-content", document.getElementById("textarea-message").innerHTML);

		//document.getElementById("contactform").reset();
		//hide_contact_form();
		//show_image_voting();
		xhr.send(data);
	}	
	function cancel_message() {
		hide_contact_form();
		window.history.go(-1);
		wait_and_scroll_up(50);
	}

	function send_message_prelogin() {
		var xhr = new XMLHttpRequest;
		xhr.open('POST', "/messagehandler");
		xhr.onload = function() {
			if (xhr.status === 200) {
				//document.getElementById("message-content").innerHTML=this.response;
				alert(this.response);
				//window.history.go(-1);
				location.reload();
				//window.history.go(+1);
			}
			else {
				//alert('Message sending failed.  Returned status of ' + xhr.status);
				alert('Message sending failed.  Returned status of ' + xhr.responseText);
			}

		};
		var data = new FormData();
		data.append("sender-name", document.getElementById("text-name-prelogin").value);
		data.append("sender-email", document.getElementById("text-email-prelogin").value)
		data.append("message-content", document.getElementById("textarea-message-prelogin").innerHTML);

		//document.getElementById("contactform").reset();
		hide_contact_form();
		//show_image_voting();
		xhr.send(data);
	}	
	function show_contact_form_prelogin(){
		//history.pushState({url:contacturl.substr(1)}, null, contacturl);
		//history.pushState({url:contacturl}, null, contacturl);
		//document.getElementById("show-upload-button").style.display = "none";
		document.getElementById("contact-form-div-prelogin").style.display = "block";
		document.getElementById("show-contact-button-prelogin").style.display = "none";
		document.getElementById("email-and-password-entry").style.display = "none";
		document.getElementById("faq-prelogin-div").style.display = "none";
		document.getElementById("contact-prelogin-div").style.display = "none";
		document.getElementById("contact-form-buttons-prelogin").style.display = "block";
		wait_and_scroll_up(50);
		//document.getElementById("show-upload-and-contact-button-div").style.display = "none";
		hide_upload_form();
		hide_image_voting();
	}
	function cancel_message_prelogin() {
		location.reload();
	}

	/// upload image
	function show_upload_form(){
		// send empty GET to check for cookies
		var xhr = new XMLHttpRequest;
		xhr.open('GET', "/login");
		xhr.onload = function() {
			if (xhr.status === 200) {
	//			var path = window.location.pathname;
	//			js_routing(path);
				history.pushState({url: uploadurl}, null, uploadurl);
				hide_image_voting();
				hide_contact_form();
				hide_home_page();
				adj_reload();
				document.getElementById("show-contact-button").style.display = "none";
				document.getElementById("imagetoupload").src = "";
				document.getElementById("upload-form-div").style.display = "block";
				document.getElementById("show-upload-button").style.display = "none";
				document.getElementById("upload-image-button-div").style.display = "block";
				document.getElementById("imagetoupload").style.display = "block";
				wait_and_scroll_up(50);
			}
			else if (xhr.status !== 200) {
				overlay_on();
			}
		};
		xhr.send();
	}
	function show_upload_form_hist(){
		// send empty GET to check for cookies
		var xhr = new XMLHttpRequest;
		xhr.open('GET', "/login");
		xhr.onload = function() {
			if (xhr.status === 200) {
	//			var path = window.location.pathname;
	//			js_routing(path);
	//			history.pushState({url: uploadurl}, null, uploadurl);
				hide_image_voting();
				hide_contact_form();
				document.getElementById("show-contact-button").style.display = "none";
				document.getElementById("imagetoupload").src = "";
				document.getElementById("upload-form-div").style.display = "block";
				document.getElementById("show-upload-button").style.display = "none";
				document.getElementById("upload-image-button-div").style.display = "block";
				document.getElementById("imagetoupload").style.display = "block";
					}
			else if (xhr.status !== 200) {
				overlay_on();
					}
		};
		xhr.send();
	}
	function hide_upload_form(){
		document.getElementById("upload-form-div").style.display = "none";
		document.getElementById("show-upload-button").style.display = "block";
		document.getElementById("upload-image-button-div").style.display = "none";
		document.getElementById("imagetoupload").style.display = "none";
		clear_upload_form();
	}
	function clear_upload_form(){
		//document.getElementById("text-adj-1").value="";
		//document.getElementById("text-adj-2").value="";
		document.getElementById("userinputfile").value="";
		document.querySelector('#imagetoupload').setAttribute("src", "");
		document.getElementById("imagetoupload").setAttribute("src", "#");
	}
	function show_uploaded_pic(){
		hide_upload_form();
		hide_bottom_buttons();
		document.getElementById("post-upload").style.display="block";
	}
	function upload_image() {
		// send empty GET to /login to check for session cookie before uploading  
		// alternatively, check session status serverside only: current approach
		//	var xhr = new XMLHttpRequest;
		//	xhr.open('GET', "/login");
		//	xhr.onload = function() {
		//		if (xhr.status === 200) {
				//alert("in upload_image func");
				var xhr1 = new XMLHttpRequest;
				xhr1.open('POST', "/uploadhandler");
				xhr1.onload = function() {
					//clear_upload_form();
					//alert(this.response);
					if (xhr1.status === 200) {
						clear_upload_form();
						alert('Upload successful');
						show_uploaded_pic();
						//window.history.go(-1);
					}
					else {
						alert(this.response);
						//alert('upload failed. try again.' );
						if (xhr1.status === 400) {
							clear_upload_form();
							alert('Your session has expired, please log in again');
							clear_login_form();
							overlay_on();
						}
					}
				};
				var data = new FormData();
				data.append("inputfile", file);

				var select1 = (document.getElementById("adj-select-1"));
				var text_choice1 = select1.options[select1.selectedIndex].text;
				var value1 = select1.options[select1.selectedIndex].value;
				var select2 = (document.getElementById("adj-select-2"));
				var text_choice2 = select2.options[select2.selectedIndex].text;
				var value2 = select2.options[select2.selectedIndex].value;

				var adj1 = text_choice1;
				var adj2 = text_choice2;
		//		var adj2 =  document.getElementById("text-adj-2").value;
		//		var adj1 =  document.getElementById("text-adj-1").value;

				if (value1 != 0 && value2 != 0 && file ) {
					data.append("adj1", adj1);
					data.append("adj2", adj2);
					xhr1.send(data);
				}  else {
					alert ("Please select a photo and an adjective before uploading...");
				}

		
	//			}
	//		else if (xhr.status !== 200) {
	//			alert('Your session has expired, please log in again');
	//			clear_login_form();
	//			overlay_on();
	//				}
	//	};
	//	xhr.send();
	}	
	function cancel_upload() {
		clear_upload_form();
		hide_upload_form();
		window.history.go(-1);
		wait_and_scroll_up(50);
	}
	function adj_choose(choice){
		var x = choice.options[choice.selectedIndex].text;
		var select1 = (document.getElementById("adj-select-1"));
		var choice1 = select1.options[select1.selectedIndex].value;
		var select2 = (document.getElementById("adj-select-2"));
		var choice2 = select2.options[select2.selectedIndex].value;
		
		if (choice2 == 0 && choice1 != 0) {
			document.getElementById("adj-select-2").value = document.getElementById("adj-select-1").value;
		}
		if (choice1 == 0 && choice2 != 0) {
			document.getElementById("adj-select-1").value = document.getElementById("adj-select-2").value;
		}
	}
	function adj_reload() {
		var option_values_array = [ //
			[0, 1, 2, 3, 4, 5, 6]
			,[0, 1, 2, 3, 4, 5]
		];
		var option1_words_array = [ //
			["Choose a word", "Vibrant", "Traditional", "Classy", "Chic", "Glamorous", "Sexy"]
			,["Choose an opinion", "Yes", "May be", "I agree", "Yay", "Fuck yeah!"]
		];
		var option2_words_array = [ //
			["Choose a second word", "Muted", "Trendy", "Casual", "Pedestrian", "Plain", "Homely"]
			,["Choose a second opinion", "No", "May be not", "I disagree", "Nay", "Hell no!"]
		];

		var dropdown1 = document.getElementById("adj-select-1"); 
		var dropdown2 = document.getElementById("adj-select-2"); 

		var dropdown1_length = dropdown1.length;
		var dropdown2_length = dropdown2.length;

		for(var i = 0; i < dropdown2_length; i++) {
			dropdown2.remove(dropdown2.i);
		}

		for(var i = 0; i < dropdown1_length; i++) {
			dropdown1.remove(dropdown1.i);
		}

		var randomnumber = random_number_between(0,1); //
		var option_values = option_values_array[randomnumber];
		var option1_words = option1_words_array[randomnumber];
		var option2_words = option2_words_array[randomnumber];

		var options_length = option_values.length;

		for(var i = 0; i < options_length; i++){
			var val = option_values[i];

			var txt1 = option1_words[i];
			var txt2 = option2_words[i];

			var el1 = document.createElement("option");
			var el2 = document.createElement("option");

			el1.value = val;
			el2.value = val;
			el1.textContent = txt1;
			el2.textContent = txt2;

			dropdown1.options.add(el1);
			dropdown2.options.add(el2);
		}
		dropdown1.selectedIndex = 0;
		dropdown2.selectedIndex = 0;

		dropdown1.options[0].disabled = true;
		dropdown2.options[0].disabled = true;
	}

	/// miscellaneous functions
	//simple alert function for generic testing
	function showalert(){
		alert("foo");
	}
	//sleep for given time
	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	//scroll to 1,1 after waiting time (scroll up seems to work only after slight delay - presumably for composing the page?)
	async function wait_and_scroll_up(x) {
			await sleep(x);
			window.scrollTo(1,1);
	}
	//share page on clicking share icon
	document.getElementById("shareicon").addEventListener('click', () => {
	  if (navigator.share) {
		      navigator.share({
				        title: 'JoChoice.',

				        text: 'Share your opinion. Match words to images, vote on this picture!',
				        url: window.location.href
					  }).then(() => {
				        console.log('Thanks for sharing!');
				      })
					  .catch(err => {
						  console.log(`Couldn't share because of`, err.message);
					  });
	  } else {
	      //console.log('web share not supported');
		  //shareDialog.classList.add('is-open');
		  document.getElementById("sharefallback").style.display = 'flex';
		  //shareBtn.style.display = 'none';
	  }
	});
	//get random number between min and max
	function random_number_between(min, max) { // min and max included 
	  return Math.floor(Math.random() * (max - min + 1) + min);
	}
	//fingerprinting
	function fingerprint(){
//		// 1. using clientjs https://github.com/jackspirou/clientjs 
//		// Create a new ClientJS object
//		var client = new ClientJS();
//		// Get the client's fingerprint id
//		var fingerprint = client.getFingerprint();
//		// Print the 32bit hash id to the console
//		console.log(fingerprint);

		//2. using fingerprintjs2 https://github.com/Valve/fingerprintjs2
		var options = {};
		var murmur;
//		if (window.requestIdleCallback) {
//			requestIdleCallback(function () {
//				Fingerprint2.get(options, function (components) {
//				  //console.log(components); // an array of components: {key: ..., value: ...}
//				  var values = components.map(function (component) { return component.value });
//				  murmur = Fingerprint2.x64hash128(values.join(''), 31);
//				  console.log(murmur);
//				  //alert(murmur);
//				})
//			})
//		} else {
			setTimeout(function () {
				Fingerprint2.get(options, function (components) {
				  //console.log(components); // an array of components: {key: ..., value: ...}
				  var values = components.map(function (component) { return component.value });
				  murmur = Fingerprint2.x64hash128(values.join(''), 31);
				  //alert(murmur);
				  console.log(murmur);
				  //return murmur;
				  fp = murmur;
				})  
			}, 500)
		//}
	}

	//UNUSED - upload file on submit button click
	//document.addEventListener('DOMContentLoaded',function() {
	//	document.querySelector('#uploadimagebutton').addEventListener('click', function () {
	//			alert("button clicked");
	//		    //var files = this.files;
	//			//console.log(files);
	//			uploadFile(file); // call the function to upload the file
	//	}, false)}
	//	, false);
	//
	//function uploadFile(file){
	//	var url =  "/uploadhandler";
	//	var xhr = new XMLHttpRequest();
	//	var fd = new FormData();
	//	xhr.open("POST", url, true);
	//	xhr.onreadystatechange = function() {
	//		if (xhr.readyState === 4 && xhr.status === 200) {
	//			// Every thing ok, file uploaded
	//			 console.log(xhr.responseText); // handle response.
	//			 } else if(xhr.readyState == 4){
	//			 // with some error
	//			 console.log(xhr.responseText); // handle response.
	//			 }
	//		 };
	//	fd.append("inputfile", file);
	//	fd.append("adj1", document.getElementById("text-adj-1").value);
	//	fd.append("adj2", document.getElementById("text-adj-2").value);
	//	xhr.send(fd);
	// }
	//


