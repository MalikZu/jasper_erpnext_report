frappe.provide("jasper");


cur_frm.cscript["jasper_parameters_on_form_rendered"] = function(doc){
	var cur_grid_doc = cur_frm.cur_grid && cur_frm.cur_grid.doc;

	//cur_frm.cur_grid.fields_dict.param_expression.toggle(0);
	cur_frm.cur_grid.grid_form.fields_dict.param_expression.toggle(0);
	refresh_field("param_expression", cur_frm.cur_grid.doc.name, "jasper_parameters");

	//cur_frm.cur_grid.fields_dict.jasper_field_doctype.toggle(0);
	cur_frm.cur_grid.grid_form.fields_dict.jasper_field_doctype.toggle(0);
	refresh_field("jasper_field_doctype", cur_frm.cur_grid.doc.name, "jasper_parameters");

	if (cur_grid_doc.is_copy === "Is doctype id"){
		cur_frm.cur_grid.grid_form.fields_dict.jasper_field_doctype.toggle(1);
		refresh_field("jasper_field_doctype", cur_frm.cur_grid.doc.name, "jasper_parameters");
		cur_frm.cur_grid.refresh();
		return;
	}else if (cur_grid_doc.is_copy === "Is for where clause"){
		//cur_frm.cur_grid.fields_dict.param_expression.toggle(1);
		cur_frm.cur_grid.grid_form.fields_dict.param_expression.toggle(1);
		refresh_field("param_expression", cur_frm.cur_grid.doc.name, "jasper_parameters");
		cur_frm.cur_grid.refresh();
		return;
	}

};

frappe.ui.form.on("Jasper Parameter", "is_copy", function(frm, doctype, name){
	var row = locals[doctype][name];
	frm.fields_dict["jasper_parameters"].grid.grid_rows_by_docname[name].toggle_display("param_expression",0);
	refresh_field("param_expression", name,"jasper_parameters");
	frm.fields_dict["jasper_parameters"].grid.grid_rows_by_docname[name].toggle_display("jasper_field_doctype",0);

	switch(row.is_copy){
		case "Is for where clause":
			frm.fields_dict["jasper_parameters"].grid.grid_rows_by_docname[name].toggle_display("param_expression",1);
			row.param_expression = "In";
			refresh_field("param_expression", name,"jasper_parameters");
			row.jasper_param_action = "Automatic";
			refresh_field("jasper_param_action",name,"jasper_parameters");
			break;
		case "Is for page number":
		case "Is for copies":
		case "Is for server hook":
			row.param_expression = "";
			row.jasper_param_action = "Automatic";
			refresh_field("param_expression", name,"jasper_parameters");
			refresh_field("jasper_param_action",name,"jasper_parameters");
			break;
		case "Is for field doctype":
		case "Is doctype id":
			frm.fields_dict["jasper_parameters"].grid.grid_rows_by_docname[name].toggle_display("jasper_field_doctype",1);
			break;
		default:
			row.param_expression = "";
			row.jasper_param_action = "Ask";
			refresh_field("jasper_param_action", name,"jasper_parameters");
			refresh_field("param_expression", name,"jasper_parameters");
	}
});

frappe.ui.form.on("Jasper Parameter", "param_expression", function(frm, doctype, name){
	var row = locals[doctype][name];
	if (row.is_copy !== "Is for where clause"){
		row.param_expression = "";
		refresh_field("param_expression", name,"jasper_parameters");
	}else if(row.param_expression == ""){
		row.param_expression = "In";
		refresh_field("param_expression", name,"jasper_parameters");
	}
});

frappe.ui.form.on("Jasper Parameter", "jasper_param_action", function(frm, doctype, name){
	var row = locals[doctype][name];
	if (row.is_copy === "Is for server hook" || row.is_copy === "Is for page number" || row.is_copy === "Is for copies"){
		row.jasper_param_action = "Automatic";
	}else if (row.is_copy === "Other"){
		row.jasper_param_action = "Ask";
	}else if (row.is_copy === "Is for where clause" && frm.doc.jasper_report_type !== "General"){
		row.jasper_param_action = "Automatic";
	}

	refresh_field("jasper_param_action", name,"jasper_parameters");
});

cur_frm.cscript.refresh = function(doc){
    var cs = cur_frm.cscript;
    
    cs.show_fields(doc);
    
    var query = doc.query != undefined? doc.query:"";
    var code = '<div class="panel panel-default">'
                 + '<div class="panel-heading">'
                    + '<h3 class="panel-title">SQL</h3>'
                 + '</div>'
                 + '<div class="panel-body">'
                        + '<pre class="bs-callout-bg bs-callout-warning-bg">' + query + '</pre>'
                 + '</div>'
             + '</div>';

    cur_frm.fields_dict.query_html.$wrapper.html(code);
    if(doc.__islocal !== 1){
        cs.update_upload(doc);
	}

	var locals = ["Do Not Use","Ask"];
	locals.push.apply(locals, jasper.make_country_list());
	if (doc.jasper_report_origin === "LocalServer"){
		cur_frm.set_df_property("jasper_locale", "options", locals);
		unhide_field(["jasper_locale","report", "jasper_custom_fields"]);
		if (doc.__islocal === 1 || doc.jasper_locale.trim() === ""){
			doc.jasper_locale = "Do Not Use";
		}
    }else{
		hide_field(["jasper_locale", "jasper_custom_fields"]);
    }

	cur_frm.cscript.setServerType(doc);
	cur_frm.cscript.report_fields(doc);
};

cur_frm.cscript["jasper_locale"] = function(doc){
	var page;
	if (doc.jasper_report_type === "Form" || doc.jasper_report_type === "List"){
		page = doc.jasper_report_type  + "/" + doc.jasper_doctype;
	}
	var robj = jasper.get_jasperdoc_from_name(doc.name, page);
	if (robj){
		robj.locale = doc.jasper_locale;
	}
};

cur_frm.cscript["jasper_report_origin"] = function(doc, dt, dn){
    var origin = doc.jasper_report_origin;
    if (origin === "JasperServer"){
        hide_field(["jasper_upload_jrxml_file", "jasper_upload_btn", "jasper_virtualizer", "jasper_all_sites_report", "jasper_locale","report", "jasper_custom_fields"]);
        if (doc.__islocal){
            cur_frm.set_value("jasper_report_path", "");
        }
        unhide_field(["jasper_report_path"]);
    }else if(doc.__islocal){//never saved
        hide_field(["jasper_upload_jrxml_file", "jasper_upload_btn", "jasper_virtualizer", "jasper_report_path", "jasper_all_sites_report"]);
        cur_frm.set_value("jasper_report_path", "/");
        unhide_field(["report", "jasper_custom_fields", "jasper_locale", "jasper_virtualizer"]);
    }else{
        unhide_field(["jasper_upload_jrxml_file", "jasper_upload_btn", "jasper_virtualizer", "jasper_locale", "report", "jasper_custom_fields"]);
        hide_field(["jasper_report_path"]);
    }
};

cur_frm.cscript.show_fields = function(doc){
    var origin = doc.jasper_report_origin;
    if (origin === "JasperServer"){
        hide_field(["jasper_upload_jrxml_file", "jasper_upload_btn", "jasper_virtualizer", "jasper_all_sites_report","report"]);
    }else if(doc.__islocal){//never saved
        hide_field(["jasper_upload_jrxml_file", "jasper_upload_btn", "jasper_virtualizer", "jasper_report_path", "jasper_all_sites_report"]);
        cur_frm.set_value("jasper_report_path", "/");
    }else{
        hide_field(["jasper_report_path", "jasper_all_sites_report"]);
    }
    
};

cur_frm.cscript.report = function(doc){
	cur_frm.cscript.report_fields(doc);
};

cur_frm.cscript.setServerType = function(doc){
	var server_type = jasper.server_type() || "";
	if (server_type === "both"){
		cur_frm.set_df_property("jasper_report_origin", "options", ["JasperServer", "LocalServer"]);
	}else if(server_type === "jasperserver only"){
		cur_frm.set_df_property("jasper_report_origin", "options", ["JasperServer"]);
	}else if(server_type === "local jrxml only"){
		cur_frm.set_df_property("jasper_report_origin", "options", ["LocalServer"]);
	}else{
		cur_frm.set_df_property("jasper_report_origin", "options", [""]);
	}
};

cur_frm.cscript.report_fields = function(doc){
	if (doc.report && doc.report.trim() !== ""){
		var jasper_report_type = doc.jasper_report_type;
		cur_frm.set_df_property("jasper_report_type", "options", ["General", "Server Hooks"]);
		if(jasper_report_type && (jasper_report_type.trim() !== "General" || jasper_report_type.trim() !== "Server Hooks")){
			doc.jasper_report_type = "General";
			cur_frm.refresh_field("jasper_report_type");
		}

	}else{
		cur_frm.set_df_property("jasper_report_type", "options", ["Form", "List", "General", "Server Hooks"]);
	}
};

$(document).on("save", function(ev, doc){
	var cs = cur_frm.cscript;
	if(doc.__islocal === 1){
		if (doc.jasper_report_origin === "LocalServer")
			unhide_field(["jasper_upload_jrxml_file", "jasper_upload_btn", "jasper_virtualizer", "report_images:"]);
    }
});

cur_frm.cscript.onload = function(doc){
    if(doc.__islocal !==1){
	    var cs = cur_frm.cscript;
	    var opts = cur_frm.get_field("jasper_upload_jrxml_file");
	    opts["docname"] = cur_frm.docname;
	    cs.upload = new jasper.dialog_upload_tree(opts);
	}else{
		$('#jasper_upload_tree').jstree("destroy").empty();
		$('#jasper_upload_tree').remove();
	}
};

cur_frm.cscript.jasper_upload_btn = function(doc){
	var cs = cur_frm.cscript;
	if (!cs.upload){
		var opts = cur_frm.get_field("jasper_upload_jrxml_file");
		opts["docname"] = cur_frm.docname;
		cs.upload = new jasper.dialog_upload_tree(opts);
	}
    cs.upload.show();
};

cur_frm.cscript.update_upload = function(doc){
	var cs = cur_frm.cscript;

	function children(name, msg){
		var found = [];
		for (var i=0; i<msg.length;i++){
			if(msg[i].parent_report === name){
				found.push(i);
			}
		}
		return found;
	};

	frappe.call({
	       method:  "jasper_erpnext_report.jasper_erpnext_report.doctype.jasper_reports.jasper_reports.get_attachments",
	       args: {dn: doc.name},
	       callback: function(response_data){
	       			var msg = response_data.message;
	       			cs.upload.clear_input();
	       			if (!msg || msg.length === 0)
	       				return;
	       			var roots = children("root", msg);
	       			for (var j=0; j<roots.length;j++){
	       				var pos = roots[j];
	       				cs.upload.set_input(msg[pos].name, msg[pos].file_name, msg[pos].file_url, msg[pos].parent_report);
	       				var childrens = children(msg[pos].name, msg);
	       				for (var i=0; i<childrens.length; i++){
	       					var cpos = childrens[i];
	       					cs.upload.set_input(msg[cpos].name, msg[cpos].file_name, msg[cpos].file_url, msg[pos].name);
	       				}
	       			}
	       }
     });

};
