# InformaCam-Unveillance

## Setup

1.	After cloning this repo, `cd /path/to/InformaFrontend` and pull down the necessary submodules with
	
	`git submodule update --init --recursive`

1.	Run `./setup.sh` or pre-configure the Frontend with a .json config file (see *Configure* for more info) with `./setup.sh /path/to/config.json`.
1.	Follow the prompts.

## Configure

If you have access to the corresponding Annex, create a config file like so:

1.	`cd /path/to/InformaAnnex/lib/Annex`
1.	`python unveillance_annex.py -config`
1.	copy the output json object into a file of your choosing.

You may edit any of the directives to suit your needs, or add others that might help with your specific setup using the following directives as your guide.

#### Configuration Directives

###### Local Directives

*	ssh_root (str)
	The full path to your SSH config

*	api.port (int)
	
	The port the Frontend should run on

*	web_home_mime_types (list str)

	Home page will automatically query for documents matching these mime types

###### Annex-specific Directives

*	server_host (str)
	The Annex server's hostname
*	server_user (str)
	The user to invoke via SSH when communicating to the server
*	uv_uuid (str)
	The shortcode for the server
*	server_message_port (int)
	The port the Annex Channel broadcast's on.  (It is assumed that the annex channel is on the same host as the Annex.)
*	annex_remote (str)
	The remote folder on the Annex server that holds submissions

## Messaging

#### Format

Messages from the annex channel will have the following format:

	{
		"_id" : "c895e95034a4a37eb73b3e691e176d0b",
		"status" : 302,
		"task_path" : "Intake.intake.doIntake",
		"task_type" : "UnveillanceTask"
	}

The annex channel will also send messages acknowledging the status of the connection.  Developers can do with that what they will.

#### Status Codes

*	201 (Created) Task has been registered.
*	302 (Found) Task is valid, and can start.
*	404 (Not Found) Task is not registered; cannot start.
*	200 (OK) Task completed; finishing.
*	412 (Precondition Failed) Task failed; will finish in failed state.
*	205 (Reset Content) Task persists, and will run again after the designated period.
*	410 (Gone) Task deleted from task queue.