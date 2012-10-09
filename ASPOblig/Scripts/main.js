var selectedChannel;
var currentNick;

$(document).ready(function () {
    window.onbeforeunload = function () { 
        $.get("Chat/Logout"); 
    }

    /*$(window).keyup(function(event) {
        if (event.which == 13) {
            $("#entry").focus();
        }
    });*/

    $("#addChannel").click(function () {
        $(this).hide();
        $("#textbox-channel").show();
        $("#textbox-channel").focus();
    });

    $("#logout").click(function () {
        $.get("Chat/Logout", function () {
            location = "";
        });
    });

    $("#userinfo").click(function () {
        slideToggleMenu("#userinfo", "#menu");
        if ($("#contactlist").is(":visible")) {
            $("#contactlist").slideToggle("fast");
        }
    });

    $("#contacts").click(function() {
        slideToggleMenu("#contacts", "#contactlist");
        if ($("#menu").is(":visible")) {
            $("#menu").slideToggle("fast");
        }
    });

    $("#textbox-channel").keypress(function (event) {
        if (event.which == 13) {
            if ($(this).val() != "") {
                joinChannel($(this).val());
            }
            $(this).val("");
            $(this).hide();
            $("#addChannel").show();
        }
    });

    $("#textbox-channel").focusout(function () {
        $(this).hide();
        $("#addChannel").show();
    });

    $("#entry").keypress(function (event) {
        if (event.which == 13) {
            if (selectedChannel != null) {
                var message = $("#entry").val();
                if (message != "") {
                    $.get("Chat/SendMessage", { message: message, destination: selectedChannel });
                    write(message, selectedChannel, currentNick);
                }
            }
            $("#entry").val("");
        }
    });

    $("#modaloverlay").click(hideModal);

    $("#textbox-allowUser").keypress(function (event) {
        if (event.which == 13) {
            var user = $(this).val();
            if (user != "") {
                var allowedUser = $('<option value="' + user + '">' + user + '</option>').appendTo("#select-allowedUsers");
                $(allowedUser).click(function() {
                    $(this).remove();
                });
            }
            $("#textbox-allowUser").val("");
        }
    });

    $("#radio-channelPrivate").click(function() {
        $("#allowUsers").show();
    });

    $("#radio-channelOpen").click(function() {
        $("#allowUsers").hide();
    });

    $("#select-allowedUsers option").click(function() {
        $(this).remove();
    });

    $("#button-saveChannel").click(function() {
        var type = $('#modal-channel input[type="radio"]:checked').val();
        var allowedUsers = [];
        var mods = [];

        $("#select-allowedUsers option").each(function() {
            allowedUsers.push($(this).val());
        });

        $("#select-admins option").each(function() {
            mods.push($(this).val());
        });

        $.get("Chat/SetChannelSettings", { channel: selectedChannel, type: type, allowedUsers: allowedUsers, mods: mods });
    });

    $.get("Chat/GetUserData", function (result) {
        currentNick = result;
        $("#userinfo").html("Du er <b>" + currentNick + "</b>");
    });

    $.get("Chat/Join", function () {
        joinChannel("Lobby");
        setTimeout(refreshMessages, 1000);
    });
});

function refreshUsers(channel) {
    $.get("Chat/GetUsers", { channel: channel }, function (result) {
        var userlist = "#users-" + channel;
        $(userlist).html("");
        for (n in result) {
            $(userlist).append('<p>' + result[n].nick + '</p>');
        }
        $(userlist + "-container").scrollbarPaper();            

        $("#" + channel + "-header .chat-usercount").html(result.length);
        if (channel == selectedChannel) {
            document.title = selectedChannel + " [" + result.length + "]";                
        }

        setTimeout(function () { refreshUsers(channel); }, 100);
    });
}

function joinChannel(channel) {
    $.get("Chat/JoinChannel", { channel: channel }, function(result) {

        $("#addChannel").before('<div id="chan-' + channel + '" class="tab">' + channel + '<div class="close">x</div></div>');
        $("#chats").append('<div id="' + channel + '-header" class="chat-header"><h2>' + channel + '</h2><div class="chat-usercount">0</div></div><div id="' + channel + '-container" class="chat-container"><div id="' + channel + '" class="chat"></div></div>');
        $("#userlists").append('<div id="users-' + channel + '-container" class="users-container"><div id="users-' + channel + '" class="users"></div></div>');

        selectedChannel = channel;
        showChannel(channel);
        fixScroll("#" + channel + "-container");        
        fixScroll("#users-" + channel + "-container");
        refreshUsers(channel);

        write(result, selectedChannel, "SYSTEM");

        $("#" + channel + "-header").click(function() {
            if (result == "owner") {
                showModal("modal-channel");   
                //loadSettings(channel);             
            }
        });

        $(".tab").click(function () {
            var channel = $(this).attr("id").split("-")[1];
            if (channel != null) {
                selectedChannel = channel;
                showChannel(selectedChannel);
            }
        });

        $(".tab .close").click(function() {
            leaveChannel($(this).parent().attr("id").split("-")[1]);
        }); 
    }); 

     
}

function leaveChannel(channel) {
    $.get("Chat/LeaveChannel", { channel: channel });

    if (selectedChannel == channel) {
        selectedChannel = null;
    }

    $("#chan-" + channel).fadeOut("fast", function () {
        $("#chan-" + channel).remove();
        $("#" + channel + "-header").remove();
        $("#" + channel + "-container").remove();
        $("#users-" + channel + "-container").remove();
    });
}

function refreshMessages() {
    $.get("Chat/GetMessages", function (result) {
        for (n in result) {
            if (result[n].destination == currentNick) {
                if ($("#chan-pm-" + result[n].sender).length < 1) {
                    $("#pms").append('<div id="chan-pm-' + result[n].sender + '" class="tab-pm">' + result[n].sender + '</div>');                        
                    $("#chats").append('<div id="pm-' + result[n].sender + '-container" class="chat-container"><div id="pm-' + result[n].sender + '" class="chat"></div></div>');
                    $("#chan-pm-" + result[n].sender).click(function() {
                        showChannelPm(result[n].sender);
                    });
                }
                write(result[n].message, "pm-" + result[n].sender, result[n].sender);
            }
            else {
                write(result[n].message, result[n].destination, result[n].sender);
            }
        }

        setTimeout(refreshMessages, 100);
    });
}

function write(message, channel, nick) {
    var date = new Date();
    var time = pad(date.getHours()) + ":" + pad(date.getMinutes());

    $("#" + channel).append('<p class="message"><span class="timestamp">[' + time + ']</span> <b>' + nick + '</b> ' + message);
    $(".message").fadeIn("fast");
    $("#" + channel + "-container").scrollTop($("#" + channel + "-container").prop("scrollHeight"));
}

function showChannel(channel) {
    $(".tab, .tab-pm").removeClass("selected");
    $("#chan-" + channel).addClass("selected");
    $(".chat-header").hide();
    $("#" + channel + "-header").show();
    $(".chat-container").hide();
    $("#" + channel + "-container").show();
    $("#" + channel + "-container").scrollbarPaper();
    $(".users-container").hide();
    $("#users-" + channel + "-container").show();
}

function showChannelPm(sender) {
    $(".tab-pm, .tab").removeClass("selected");
    $("#chan-pm-" + sender).addClass("selected");
    $(".chat-container").hide();
    $("#pm-" + sender + "-container").show();
    $("#pm-" + sender + "-container").scrollbarPaper();
}

function fixScroll(elem) {
    $(elem).mousewheel(function(event, delta) {
        $(elem).scrollTop($(elem).scrollTop() - delta*100);
    });
}

function slideToggleMenu(button, menu) {
    if ($(menu).is(":visible")) {
        $(button).removeClass("selected");
    }
    else {
        $(button).addClass("selected");            
    }
    $(menu).toggle();
}

function showModal(name) {
    $("#modaloverlay").fadeIn();
    $("#" + name).show();
}

function hideModal() {
    $("#modaloverlay").hide();
    $(".modal").hide();
}

function loadSettings(channel) {
    $.get("Chat/GetChannelSettings", { channel: channel }, function (result) {
        write(result.type, selectedChannel, "SYSTEM");

        if (result.type == "open") {
            $("#radio-channelOpen").attr("checked", "checked");
        }
        else {
            $("#radio-channelPrivate").attr("checked", "checked");
        }
    });
}

function pad(n) {
    if (n < 10) {
        return "0" + n;
    }
    return n;
}