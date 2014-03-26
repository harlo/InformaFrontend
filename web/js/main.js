var compass_file_system, compass_canvas, compass_console, compass_stage;

function redistributePanels() {
	var left_anchor = 0;	
	var panels = $("#c_panel_holder .c_panel");
	
	$.each(panels, function(idx, panel) {
		if(left_anchor != 0) {
			$(panel).css('left', left_anchor);
		}
		
		if($(panel).css('display') != 'none') {
			left_anchor = $(panel).position().left + $(panel).width();
		}
		
		if(idx == panels.length - 1) {
			var rest_of_screen = $("#c_panel_holder").width() - left_anchor;
			
			$(panel).css('width', rest_of_screen + $(panel).width());
		}
	});
}

function restorePanel(panel) {
	$("#" + panel).removeClass('c_panel_is_collapsed');
	if($("#" + panel).hasClass('c_panel_full_collapse')) {
		$("#" + panel).css('display','block');
	} else {
		var b = "[rel='" + panel + "']";	
		$(".c_panel_restore" + b).css('display','none');
	}
	
	redistributePanels();
}

function collapsePanel(panel) {
	$("#" + panel).addClass('c_panel_is_collapsed');
	if($("#" + panel).hasClass('c_panel_full_collapse')) {
		$("#" + panel).css('display','none');
	} else {
		var b = "[rel='" + panel + "']";	
		$(".c_panel_restore" + b).css('display','block');
	}
	
	redistributePanels();
}

function setCollapsibleButtons() {
	$.each($(".c_panel_restore"), function(idx, item) {
		var attached_to = $("#" + $(item).attr('rel'));
		$(item).css('left', $(attached_to).position().left);
	});
}

function initModels() {
	compass_canvas = new CompassCanvas();
	compass_documents = new CompassFileSystem();
	compass_stage = new CompassStage();
	
	initGroupHandle();
	
	initConsole();
}

function applyFilter() {
}

function toggleGroup() {
	compass_documents.as_group = !compass_documents.as_group;
	updateGroupUIHandle(compass_documents.as_group);
}

function contextualize() {

}

function updateGroupUIHandle(retain_group) {
	var file_handles = $(compass_documents.ui_root).find(".c_object_handle");
	var c_selected = [];

	if(!retain_group) {
		$.each(file_handles, function(idx, item) {
			$(item).removeClass("c_selected");
			compass_documents.documents.at(idx).selected = false;
		});
	} else {
		c_selected = $(".c_selected");
		
		if(c_selected.length == 0 && compass_documents.as_group) {
			$.each(file_handles, function(idx, item) {
				$(item).addClass("c_selected");
				compass_documents.documents.at(idx).selected = true;
			});
			
			c_selected = file_handles;
		}
	}
		
	$("#c_file_group_num").html(c_selected.length);
	$("#c_file_group_label").html("document" + (c_selected.length == 1 ? "" : "s"));

	if(compass_documents.as_group) {
		$("#c_file_group_indicator").addClass("c_activated");
		compass_group_handle.setActive();
	} else {
		$("#c_file_group_indicator").removeClass("c_activated");
		compass_group_handle.setInactive();
	}
}

$(document).ready(function() {
	setCollapsibleButtons();
	redistributePanels();
	initModels();
	updateGroupUIHandle();
	
	setDummyData();
});