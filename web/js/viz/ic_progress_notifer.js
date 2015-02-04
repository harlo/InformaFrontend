var app = app || {};//global Backbone

app.InformaCamProgressNotifierView = Backbone.View.extend({
	initialize: function(options) {
		this.tasksCompleted = [];
	},
	render: function(message) {
		var status = message.status;
		if (message.doc_id != app.docid || status != 200) {
			return;
		}
		if (this.tasksCompleted.length == 0) {
			this.$el.prepend('<h2>Task Progress</h2>');
			this.$el.addClass("rendered");
		}
		if (message.task_queue !== undefined) {
			$('#tasksTotal').html(message.task_queue.length);
			var task_path = message.task_path;
			if (!_.contains(this.tasksCompleted, task_path)) {
				this.tasksCompleted.push(task_path);
				$('#tasksComplete').html(this.tasksCompleted.length);
				this.$el.append(task_path + '<br>');
			}
		}
	}
});

