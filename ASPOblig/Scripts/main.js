var selectedChannel;
var currentNick;

$(document).ready(function () {
    window.onbeforeunload = function () { 
        $.get("Chat/Logout"); 
    }

    $(window).keyup(function(event) {
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

    //brukes for å legge til en melding og sender den til rett destinasjon, menldingen lagres også i DB
    $("#entry").keypress(function (event) {
        if (event.which == 13) {
            if (selectedChannel != null) {
                var message = $("#entry").val();
                if (message != "") {
                    var strippedMessage = message.replace(/(<([^>]+)>)/ig,"");
                    var messageElem = write("tmp", strippedMessage, selectedChannel, currentNick);
                    $.get("Chat/SendMessage", { message: "msg:" + strippedMessage, destination: selectedChannel }, function(id) {
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
                $(allowedUser).click(function() {
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
                $(addedMod).click(function() {
                    $(this).remove();
                });
            }
            $("#textbox-addAdmin").val("");
        }
    })

    $("#radio-channelPrivate").click(function() {
        $("#allowUsers").show();
    });

    $("#radio-channelOpen").click(function() {
        $("#allowUsers").hide();
    });

    $("#select-allowedUsers option").click(function() {
        $(this).remove();
    });

    $("#select-admins option").click(function() {
        $(this).remove();
    });

    // Sender kanaloppsettet til serveren
    $("#button-saveChannel").click(function() {
        saveSettings();
        hideModal();
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

// Henter innloggede brukere for en kanal
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

//
// Setter opp brukergrensesnittet for en kanal dersom brukeren har tilgang
//
function joinChannel(channel) {
    $.get("Chat/JoinChannel", { channel: channel }, function(result) {
        if (result != "DENIED") {
            $("#addChannel").before('<div id="chan-' + channel + '" class="tab">' + channel + '<div class="close">x</div></div>');
            $("#chats").append('<div id="' + channel + '-header" class="chat-header"><h2>' + channel + '</h2><div class="chat-usercount">0</div></div><div id="' + channel + '-container" class="chat-container"><div id="' + channel + '" data-url="Chat/FileUpload" class="chat"></div></div>');
            $("#userlists").append('<div id="users-' + channel + '-container" class="users-container"><div id="users-' + channel + '" class="users"></div></div>');

            $("#" + channel).fileupload({
                drop: function(e, data) {
                    $.each(data.files, function(index, file) {
                        writeSystem("Laster opp: " + file.name);
                    });
                },
                done: function(e, data) {
                    $.each(data.files, function(index, file) {
                        writeSystem(file.name + " ferdig!");
                    });
                },
                progressall: function(e, data) {
                    var progress = data.loaded / data.total * 100;
                    writeSystem(progress);
                }
            });

            selectedChannel = channel;
            showChannel(channel);
            fixScroll("#" + channel + "-container");        
            fixScroll("#users-" + channel + "-container");
            refreshUsers(channel);

            writeSystem(result);

            $("#" + channel + "-header").click(function() {
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

            $(".tab .close").click(function() {
                leaveChannel($(this).parent().attr("id").split("-")[1]);
            }); 
        }
        else
        {
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
            if (result[n].destination == currentNick) {
                if ($("#chan-pm-" + result[n].sender).length < 1) {
                    $("#pms").append('<div id="chan-pm-' + result[n].sender + '" class="tab-pm">' + result[n].sender + '</div>');                        
                    $("#chats").append('<div id="pm-' + result[n].sender + '-container" class="chat-container"><div id="pm-' + result[n].sender + '" class="chat"></div></div>');
                    $("#chan-pm-" + result[n].sender).click(function() {
                        showChannelPm(result[n].sender);
                    });
                }
                write("tmp", result[n].message, "pm-" + result[n].sender, result[n].sender);
            }
            else {
                if (result[n].message.indexOf("msg:") == 0) {
                    write(result[n].id, result[n].message.substring(4), result[n].destination, result[n].sender);
                }
                else if (result[n].message.indexOf("del:") == 0) {
                    var messageId = "message-" + result[n].message.split(":")[1];
                    $("#" + messageId).html('<p id="' + messageId + '" class="deleted">Meldingen har blitt slettet av en moderator.</p>');
                    setTimeout(function() { 
                        $("#" + messageId).fadeOut("fast"), function() {
                            $(this).remove();
                        }
                    }, 2000);
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