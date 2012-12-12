var selectedChannel;
var currentNick;

$(document).ready(function () {
    window.onbeforeunload = function () {
        $.get("Chat/Logout");
    }

    //$("body").click(function () {
    //    alert("!");
    //sms("4745514151", "AFRIKA", "test");
    //});



    $("#innstillinger-user").click(function () {
        window.alert("not implemented yet");
    });


    $(window).keyup(function (event) {
        if (event.which == 67) {
            $("#addChannel").hide();
            $("#textbox-channel").show();
            $("#textbox-channel").focus();
        }
    });

    // Brukes for å legge til en kanal
    $("#addChannel").click(function () {
        $(this).hide();
        $("#textbox-channel").show();
        $("#textbox-channel").focus();
    });

    $("#smsButton").click(function() {
        $(this).hide();
        $("#textbox-smsChat").show();
        $("#textbox-smsChat").focus();
    });

    // Brukes for å logge ut, setter click event på logut knappen
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

    // Viser kontaktlisten
    $("#contacts").click(function () {
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

    $("#textbox-smsChat").focusout(function() {
        $(this).hide();
        $("#smsButton").show();
    })

    //brukes for å legge til en melding og sender den til rett destinasjon, menldingen lagres også i DB
    $("#entry").keypress(function (event) {
        if (event.which == 13) {
            if (selectedChannel != null) {
                var message = $("#entry").val();
                if (message != "") {
                    var strippedMessage = message.replace(/(<([^>]+)>)/ig, "");
                    var messageElem = write("tmp", strippedMessage, selectedChannel, currentNick);
                    $.get("Chat/SendMessage", { message: "msg:" + strippedMessage, destination: selectedChannel }, function (id) {
                        messageElem.attr("id", "message-" + id);
                    });
                }
            }
            $("#entry").val("");
        }
    });

    $("#modaloverlay").click(hideModal);

    //Brukes til og velge hvem som skal ha tilgang til gitt kanal
    $("#textbox-allowUser").keypress(function (event) {
        if (event.which == 13) {
            var user = $(this).val();
            if (user != "") {
                var allowedUser = $('<option value="' + user + '">' + user + '</option>').appendTo("#select-allowedUsers");
                $(allowedUser).click(function () {
                    $(this).remove();
                });
            }
            $("#textbox-allowUser").val("");
        }
    });

    //brukes til og legge til en Administrator
    $("#textbox-addAdmin").keypress(function (event) {
        if (event.which == 13) {
            var mod = $(this).val();
            if (mod != "") {
                var addedMod = $('<option value="' + mod + '">' + mod + '</option>').appendTo("#select-admins");
                $(addedMod).click(function () {
                    $(this).remove();
                });
            }
            $("#textbox-addAdmin").val("");
        }
    })

    $("#radio-channelPrivate").click(function () {
        $("#allowUsers").show();
    });

    $("#radio-channelOpen").click(function () {
        $("#allowUsers").hide();
    });

    $("#select-allowedUsers option").click(function () {
        $(this).remove();
    });

    $("#select-admins option").click(function () {
        $(this).remove();
    });

    // Sender kanaloppsettet til serveren
    $("#button-saveChannel").click(function () {
        saveSettings();
        hideModal();
    });

    $.get("Chat/GetUserData", function (result) {
        currentNick = result.nick;
        $.get("Chat/GetPhoneNumber", { nick: currentNick }, function(result) {
            if (result.phone == "") {

            }
            else if (result.status == "inactive") {

            }
            else if (result.status == "active") {

            }
        });

        if (result.type == "admin") {
            $("#menu p:first-child").before('<a href="Admin"><p>Admin</p></a>');

            if (result.pic == "img/profilepix/") {
                $("#menu a:first-child").before('<img class="profile-image" width="48" height="64" src="img/profilepix/Bjarne.png">');
            }
            else {
                $("#menu a:first-child").before('<img class="profile-image" width="48" height="64" src="' + result.pic + '">');
            }
        }
        else {
            if (result.pic == "img/profilepix/") {
                $("#menu p:first-child").before('<img class="profile-image" width="48" height="64" src="img/profilepix/Bjarne.png">');
            }
            else {
                $("#menu p:first-child").before('<img class="profile-image" width="48" height="64" src="' + result.pic + '">');
            }
        }
        

        $(".profile-image").click(function () {
            $("#uploadProfilePic").change(function () {
                $("#profilePicForm").submit(/*function () {
                    //$.post("Chat/UploadPic", $("#profilePicForm").serialize());
                    return false;
                }*/);
            });
            $("#uploadProfilePic").click();
        });

        $("#userinfo").html("Du er <b>" + currentNick + "</b>");
    });

    $.get("Chat/Join", function () {
        joinChannel("Lobby");

        setTimeout(refreshMessages, 1000);
    });
});

function sms(to, from, message) {
    $.post("/pswin/sms/sendsms", { RCV: to, SND: from, TXT: message });
}

// Henter innloggede brukere for en kanal
function getUsers(channel) {
    $.get("Chat/GetUsers", { channel: channel }, function (result) {
        var userlist = "#users-" + channel;
        for (n in result) {
            $(userlist).append('<p id="user-' + channel + '-' + result[n].nick + '">' + result[n].nick + '</p>');
            
            $('#user-' + channel + '-' + result[n].nick).click(function(nick) {
                return function() {
                    if ($("#chan-pm-" + nick).length < 1) {
                        
                        $("#pms").append('<div id="chan-pm-' + nick + '" class="tab-pm">' + nick + '</div>');                        
                        $("#chats").append('<div id="pm-' + nick + '-container" class="chat-container"><div id="pm-' + nick + '" class="chat"></div></div>');
                        $("#chan-pm-" + nick).click(function() {
                            selectedChannel = "pm-" + nick;
                            showChannelPm(nick);
                        });
                        selectedChannel = "pm-" + nick;
                        showChannelPm(nick);
                    }
                }
            }(result[n].nick));
        }

        $("#" + channel + "-header .chat-usercount").html(result.length);
        if (channel == selectedChannel) {
            document.title = selectedChannel + " [" + result.length + "]";
        }
    });
}

//
// Setter opp brukergrensesnittet for en kanal dersom brukeren har tilgang
//
function joinChannel(channel) {
    $.get("Chat/JoinChannel", { channel: channel }, function (result) {
        if (result != "DENIED") {
            $("#addChannel").before('<div id="chan-' + channel + '" class="tab">' + channel + '<div class="close">x</div></div>');
            $("#chats").append('<div id="' + channel + '-header" class="chat-header"><h2>' + channel + '</h2><div class="chat-usercount">0</div></div><div id="' + channel + '-container" class="chat-container"><div id="' + channel + '" data-url="Chat/FileUpload" class="chat"></div></div>');
            $("#userlists").append('<div id="users-' + channel + '-container" class="users-container"><div id="users-' + channel + '" class="users"></div></div>');

            $("#" + channel).fileupload({
                drop: function (e, data) {
                    $.each(data.files, function (index, file) {
                        
                        writeSystem(selectedChannel + "Laster opp: " + file.name);
                    });
                },
                done: function (e, data) {
                    $.each(data.files, function (index, file) {
                        writeSystem(file.name + " ferdig!");
                    });
                },
                progressall: function (e, data) {
                    var progress = data.loaded / data.total * 100;
                    writeSystem(progress);
                },
                formData: { type: "upload", destination: channel }
            });

            selectedChannel = channel;
            showChannel(channel);
            fixScroll("#" + channel + "-container");
            fixScroll("#users-" + channel + "-container");
            $('#users-' + channel + '-container').scrollbarPaper();
            getUsers(channel);

            writeSystem(result);

            $("#" + channel + "-header").click(function () {
                if (result == "owner") {
                    showModal("modal-channel");
                    loadSettings(channel);
                }
            });

            $(".tab").click(function () {
                var channel = $(this).attr("id").split("-")[1];
                if (channel != null) {
                    selectedChannel = channel;
                    showChannel(selectedChannel);
                }
            });

            $(".tab .close").click(function () {
                leaveChannel($(this).parent().attr("id").split("-")[1]);
            });


        }
        else {
            alert("GÅ VEKK!");
        }
    });


}


// Forlater kanalen og fjerner den fra DOMen
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

// Henter nye meldinger
function refreshMessages() {
    $.get("Chat/GetMessages", function (result) {
        for (n in result) {
            if (result[n].destination == "pm-" + currentNick) {
                if ($("#chan-pm-" + result[n].sender).length < 1) {
                    $("#pms").append('<div id="chan-pm-' + result[n].sender + '" class="tab-pm">' + result[n].sender + '</div>');
                    $("#chats").append('<div id="pm-' + result[n].sender + '-container" class="chat-container"><div id="pm-' + result[n].sender + '" class="chat"></div></div>');
                    $("#chan-pm-" + result[n].sender).click(function () {
                        selectedChannel = "pm-" + result[n].sender;
                        showChannelPm(result[n].sender);
                    });
                }
                if (result[n].message.indexOf("msg:") == 0) {
                    write("tmp", result[n].message.substring(4), "pm-" + result[n].sender, result[n].sender);
                }
                else if (result[n].message.indexOf("file:") == 0) {
                    var filename = result[n].message.split(":")[1];
                    var sender = result[n].sender;

                    if (sender != currentNick) {
                        write(-1, " har lastet opp " + filename + ", <a target=\"_blank\" href=\"" + filename + "\">Last ned</button", result[n].destination, sender);
                    }
                }
            }
            else {
                alert(result[n].message);
                if (result[n].message.indexOf("msg:") == 0) {
                    write(result[n].id, result[n].message.substring(4), result[n].destination, result[n].sender);
                }
                else if (result[n].message.indexOf("del:") == 0) {
                    var messageId = "message-" + result[n].message.split(":")[1];
                    $("#" + messageId).html('<p id="' + messageId + '" class="deleted">Meldingen har blitt slettet av en moderator.</p>');
                    setTimeout(function () {
                        $("#" + messageId).fadeOut("fast"), function () {
                            $(this).remove();
                        }
                    }, 2000);
                }
                else if (result[n].message.indexOf("join:") == 0) {
                    var nick = result[n].message.split(":")[1];
                    var userlist = "#users-" + result[n].destination;

                    write(-1, " har blitt med i kanalen.", result[n].destination, nick);

                    if ($('#user-' + result[n].destination + '-' + nick).length < 1) {
                        $(userlist).append('<p id="user-' + result[n].destination + '-' + nick + '">' + nick + '</p>');
                        $('#user-' + result[n].destination + '-' + nick).click(function (sender) {
                            return function () {
                                if ($("#chan-pm-" + sender).length < 1) {
                                    $("#pms").append('<div id="chan-pm-' + sender + '" class="tab-pm">' + sender + '</div>');
                                    $("#chats").append('<div id="pm-' + sender + '-container" class="chat-container"><div id="pm-' + sender + '" class="chat"></div></div>');
                                    $("#chan-pm-" + sender).click(function () {
                                        selectedChannel = "pm-" + sender;
                                        showChannelPm(sender);
                                    });
                                    selectedChannel = "pm-" + sender;
                                    showChannelPm(sender);
                                }
                            }
                        } (result[n].sender));
                    }
                }
                else if (result[n].message.indexOf("leave:") == 0) {
                    var nick = result[n].message.split(":")[1];

                    write(-1, " har forlatt kanalen.", result[n].destination, nick);

                    $("#user-" + result[n].destination + "-" + nick).remove();
                }
                else if (result[n].message.indexOf("file:") == 0) {
                    var filename = result[n].message.split(":")[1];
                    var sender = result[n].sender;

                    if (sender != currentNick) {
                        write(-1, " har lastet opp " + filename + ", <a target=\"_blank\" href=\"" + filename + "\">Last ned</button", result[n].destination, sender);
                    }
                }
            }
        }

        setTimeout(refreshMessages, 100);
    });
}

// Skriver meldinger til chatboksen
function write(id, message, channel, nick) {
    var date = new Date();
    var time = pad(date.getHours()) + ":" + pad(date.getMinutes());

    var elem = $('<p id="message-' + id + '" class="message"><span class="deleteMessage">x</span><span class="timestamp">[' + time + ']</span> <b>' + nick + '</b> ' + message + "</p>").appendTo("#" + channel);

    // Sletter meldinger når du trykker på x
    elem.find(".deleteMessage").click(function() {
        var id = elem.attr("id").split("-")[1];
        elem.fadeOut("fast", function () {
            elem.remove();
        });
        $.get("Chat/SendMessage", { message: "del:" + id, destination: selectedChannel });
    });

    elem.fadeIn("fast");
    $("#" + channel + "-container").scrollTop($("#" + channel + "-container").prop("scrollHeight"));

    //private message 
   
    return elem;
}


function writeSystem(message) {
    write("tmp", message, selectedChannel, "SYSTEM");
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

// Får scrolling til å fungere på elementer som bruker scrollbarPaper
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

// Henter instillinger for en kanal og fyller dem inn i brukergrensesnittet
function loadSettings(channel) {
    $.get("Chat/GetChannelSettings", { channel: channel }, function (result) {
        if (result.type == "open") {
            $("#radio-channelOpen").attr("checked", "checked");
            $("#allowUsers").hide();
        }
        else {
            $("#radio-channelPrivate").attr("checked", "checked");
            $("#allowUsers").show();
        }

        $("#select-allowedUsers").html("");
        $("#select-admins").html("");

        for (n in result.allowedUsers) {
            var allowedUser = $('<option value="' + result.allowedUsers[n] + '">' + result.allowedUsers[n] + '</option>').appendTo("#select-allowedUsers");
            $(allowedUser).click(function() {
                $(this).remove();
            });
        }

        for (n in result.mods) {
            var mod = $('<option value="' + result.mods[n] + '">' + result.mods[n] + '</option>').appendTo("#select-admins");
            $(mod).click(function() {
                $(this).remove();
            });
        }
    });
}

function saveSettings() {
    var type = $('#modal-channel input[type="radio"]:checked').val();
    var allowedUsers = [];
    var mods = [];

    $("#select-allowedUsers option").each(function() {
        allowedUsers.push($(this).val());
    });

    $("#select-admins option").each(function() {
        mods.push($(this).val());
    });

    $.get("Chat/SetChannelSettings", { channel: selectedChannel, type: type, allowed: allowedUsers.toString(), mods: mods.toString() }, function (result) {
        writeSystem(result);
    });
}

function pad(n) {
    if (n < 10) {
        return "0" + n;
    }
    return n;
}