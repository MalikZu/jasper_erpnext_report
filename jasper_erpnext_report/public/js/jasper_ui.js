frappe.provide("jasper");

jasper.show_banner = function(msg) {
	jasper.$banner = $('<div class="toolbar-banner">'+msg+'<a class="close">&times;</a></div>')
		.prependTo($('header .navbar'));
		$("body").css({"padding-top": "70px"});
	jasper.$banner.find(".close").click(function() {
		$(".toolbar-banner").toggle(false);
		$("body").css({"padding-top": "36px"});
	});
	return jasper.$banner;
}

jasper.close_banner = function($banner){
    $banner.find(".close").click();
};

jasper.show_banner_message = function(msg, where_ok, where_cancel, bckcolor, callback){
    jasper.$banner = jasper.show_banner(msg);
    if (bckcolor != null)
		jasper.$banner.css({background: bckcolor, opacity: 0.9});
    if (where_ok != null){
	    jasper.$banner.find(where_ok).click(function(){
            callback(jasper.$banner, "ok");
        });
    };

    if(where_cancel != null){
    	jasper.$banner.find(where_cancel).click(function(){
            callback(jasper.$banner, "cancel");
        });
    };
}

jasper.check_for_ask_param = function(rname, page, callback){
    var robj = jasper.get_jasperdoc_from_name(rname, page);

    var ret;
    if (robj && robj.show_params_dialog && (robj.locale === "Ask" || (robj.params && robj.params.length > 0))){
        ret = jasper.make_dialog(robj, rname + " parameters", callback);
    }else{
        callback({abort: false});
    }
};

jasper.make_menu = function(list, key, skey){
	var f = list[key].formats;
    var email = list[key].email;
	var mail_enabled = frappe.boot.jasper_reports_list.mail_enabled;//list.mail_enabled;
	var icon_file = [];
	var html = "";
	for(var i=0; i < f.length; i++){
		var type = f[i];
		icon_file.push(repl('<i title="%(title)s" data-jr_format="%(f)s" data-jr_name="%(mykey)s" class="jasper-%(type)s"></i>', {title:key + " - " + type, mykey:key, f:f[i], type: jasper.jasper_report_formats[type]}));
	};
    if (email === 1 && mail_enabled === 1){
        icon_file.push(repl('<i title="%(title)s" data-jr_format="%(f)s" data-jr_name="%(mykey)s" class="%(type)s"></i>', {title: "send by email", mykey:key, f:"email", type: jasper.jasper_report_formats["email"]}));
    }
	html = html + '<li>'
       + repl('<a class="jrreports" href="#" data-jr_format="%(f)s" data-jr_name="%(mykey)s"',{mykey:key, f:"html"}) +' title="'+ key +' - html" >'+ icon_file.join(" ") + " " + skey  + '</a>'
 	   +'</li>';

	return html;
};

jasper.make_dialog = function(doc, title, callback){

    var fields = [];
	var params = doc.params;
	var docids = null;
	var doctype_id_fields = {};
	//Only one doctype_id field. Means, this parameters has the name (id) of open document (Form) or the ids of the selected documents in List view
	var is_doctype_id = false;

	for (var i=0; i < params.length; i++){
		var param = doc.params[i];
		if (param.is_copy === "Is doctype id"){
			is_doctype_id = true;
			if (param.jasper_field_doctype.trim() === "" && param.jasper_param_value.trim() === ""){
				docids = jasper.getIdsFromList();
				if(!docids)
					docids = cur_frm && cur_frm.doc.name;
			}else{
				var route = frappe.get_route();
				if (route[0] === "Form" && param.jasper_field_doctype.trim() !== ""){
					docids = cur_frm.doc[param.jasper_field_doctype];
				}
			}
		};
		fields.push({label:param.name, fieldname:param.name, fieldtype:param.jasper_param_type==="String"? "Data": param.jasper_param_type,
		 	description:param.jasper_param_description || "", default: docids || param.jasper_param_value});
	};

	if(doc.jasper_report_origin === "LocalServer" && doc.locale !== "Do Not Use" && doc.locale !== "not Ask"){
		var lang_default = frappe.defaults.get_user_default("lang");
		var country = jasper.get_country_from_alpha3(lang_default);
		fields.push({label:__("Locale"), fieldname:"locale", fieldtype: "Select",
	 		description: __("Select the report language."), options: jasper.make_country_list(), default:[country]});
	};

	function ifyes(d){
        if (callback){
            callback({values: d.get_values(), abort: false, is_doctype_id: is_doctype_id});
        }
	};
	function ifno(){
        if (callback){
            callback({abort: true});
        }
	};

	var d = jasper.ask_dialog(title, doc.message, fields, ifyes, ifno);
	return d;
}

jasper.ask_dialog = function(title, message, fields, ifyes, ifno) {
	var html = {fieldtype:"HTML", options:"<p class='frappe-confirm-message'>" + message + "</p>"};
	fields.splice(0,0,html);
	var d = new frappe.ui.Dialog({
		title: __(title),
		fields: fields,
		primary_action: function() { d.hide(); ifyes(d); }
	});
	d.show();
	if(ifno) {
		d.$wrapper.find(".modal-footer .btn-default").click(ifno);
	}
	return d;
};



