using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ASPOblig.Controllers
{
    public class ChatController : Controller
    {
        //
        // GET: /Chat/
                
        public ActionResult Index()
        {
            if (Session["login"] != null)
            {
                return View();
            }
            else
            {
                return RedirectToAction("Index", "Home");
            }
        }

        public void Join()
        {
            DataClassesDataContext db = new DataClassesDataContext();
            if (Session["join"] == null)
            {
                Session["currentPos"] = db.Messages.Max(m => m.id);
                Session["join"] = true;
            }
        }

        public void SendMessage(string message, string destination)
        {
            DataClassesDataContext db = new DataClassesDataContext();
            if (!String.IsNullOrWhiteSpace(message))
            {
                db.Messages.InsertOnSubmit(new Message
                {
                    sender = Session["nick"].ToString(),
                    destination = destination,
                    message = message,
                    datetime = DateTime.Now
                });
                db.SubmitChanges();
            }
        }

        public ActionResult GetMessages()
        {
            DataClassesDataContext db = new DataClassesDataContext();
            int currentPos = (int)Session["currentPos"];
            Session["currentPos"] = db.Messages.Max(m => m.id);

            var messages = db.Messages.Where(m => m.id > currentPos && db.Users.Where(u => u.nick == m.sender).First().id != (int)Session["userid"]);
            /*while (messages.Count() < 1)
            {
                System.Threading.Thread.Sleep(10);
            }*/ 
            return Json(messages, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetUserData()
        {
            return Content(Session["nick"].ToString());
        }

        public ActionResult JoinChannel(string channel)
        {
            DataClassesDataContext db = new DataClassesDataContext();
            string userType;
            
            if (db.Channels.Where(c => c.name == channel).Count() < 1)
            {
                db.Channels.InsertOnSubmit(new Channel { name = channel, type = "open" });
                db.SubmitChanges();

                int channelId = db.Channels.Where(c => c.name == channel).First().id;
                db.UserChannelMappings.InsertOnSubmit(new UserChannelMapping { channelid = channelId, type = "owner", userid = (int)Session["userid"] });
                db.SubmitChanges();

                userType = "owner";
            }
            else
            {
                int channelId = db.Channels.Where(c => c.name == channel).First().id;
                var channels = db.UserChannelMappings.Where(m => m.channelid == channelId && m.type == "mod");
                var users = db.Users.Where(u => channels.Where(c => c.userid == u.id).Count() > 0);
                var channels2 = db.UserChannelMappings.Where(m => m.channelid == channelId && m.type == "owner");
                var users2 = db.Users.Where(u => channels2.Where(c => c.userid == u.id).Count() > 0);
                if (users.Where(u => u.id == (int)Session["userid"]).Count() > 0)
                {
                    userType = "mod";
                }
                else if (users2.Where(u => u.id == (int)Session["userid"]).Count() > 0)
                {
                    userType = "owner";
                }
                else
                {
                    if (db.Channels.Where(c => c.name == channel).First().type == "private")
                    {
                        userType = "DENIED";
                    }
                    else
                    {
                        userType = "user";
                    }
                }
            }

            if (db.Channels.Where(c => c.name == channel).First().type == "private")
            {
                int channelId = db.Channels.Where(c => c.name == channel).First().id;
                var channels = db.UserChannelMappings.Where(m => m.channelid == channelId && m.type == "allowed");
                var users = db.Users.Where(u => channels.Where(c => c.userid == u.id).Count() > 0);
                if (users.Where(u => u.id == (int)Session["userid"]).Count() < 1)
                {
                    //return Content("private");
                }
            }

            db.UserChannelMappings.InsertOnSubmit(new UserChannelMapping 
            { 
                userid = (int)Session["userid"], 
                channelid = db.Channels.Where(c => c.name == channel).First().id, 
                type = "join" 
            });
            db.SubmitChanges();

            return Content(userType);
        }

        public void LeaveChannel(string channel)
        {
            DataClassesDataContext db = new DataClassesDataContext();
            int channelId = db.Channels.Where(c => c.name == channel).First().id;
            var mappings = db.UserChannelMappings.Where(ucm => ucm.userid == (int)Session["userid"] && ucm.channelid == channelId);
            db.UserChannelMappings.DeleteAllOnSubmit(mappings);
            db.SubmitChanges();
        }

        public ActionResult GetChannelSettings(string channel)
        {
            DataClassesDataContext db = new DataClassesDataContext();

            string type = db.Channels.Where(c => c.name == channel).First().type;
            int channelId = db.Channels.Where(c => c.name == channel).First().id;
            var channels = db.UserChannelMappings.Where(m => m.channelid == channelId && m.type == "allowed");
            var allowedUsers = db.Users.Where(u => channels.Where(c => c.userid == u.id).Count() > 0).Select(u => u.nick);

            var channels2 = db.UserChannelMappings.Where(m => m.channelid == channelId && m.type == "mod");
            var mods = db.Users.Where(u => channels2.Where(c => c.userid == u.id).Count() > 0).Select(u => u.nick);

            var settings = new
            {
                type = type,
                allowedUsers = allowedUsers,
                mods = mods
            };

            return Json(settings, JsonRequestBehavior.AllowGet);
        }

        public ActionResult SetChannelSettings(string channel, string type, string allowed, string mods)
        {
            DataClassesDataContext db = new DataClassesDataContext();

            Channel ch = db.Channels.Where(c => c.name == channel).First();
            ch.type = type;
            UpdateModel(ch);

            int channelId = ch.id;
            var channels = db.UserChannelMappings.Where(m => m.channelid == channelId && m.type != "join" && m.type != "owner");
            db.UserChannelMappings.DeleteAllOnSubmit(channels);
            db.SubmitChanges();

            string[] aAllowed = allowed.Split(',');
            string[] aMods = mods.Split(',');
            
            foreach (string allowedUser in aAllowed)
            {
                if (!String.IsNullOrWhiteSpace(allowedUser) && db.Users.Where(u => u.nick == allowedUser).Count() > 0)
                {
                    db.UserChannelMappings.InsertOnSubmit(new UserChannelMapping
                    {
                        userid = db.Users.Where(u => u.nick == allowedUser).First().id,
                        channelid = channelId,
                        type = "allowed"
                    });
                }
            }

            foreach (string mod in aMods)
            {
                if (!String.IsNullOrWhiteSpace(mod) && db.Users.Where(u => u.nick == mod).Count() > 0)
                {
                    db.UserChannelMappings.InsertOnSubmit(new UserChannelMapping
                    {
                        userid = db.Users.Where(u => u.nick == mod).First().id,
                        channelid = channelId,
                        type = "mod"
                    });
                }
            }

            db.SubmitChanges();
            return Content("Mods: " + aMods[0] + ", Allowed: " + aAllowed.Length);
        }

        public ActionResult GetUsers(string channel)
        {
            DataClassesDataContext db = new DataClassesDataContext();
            int channelId = db.Channels.Where(c => c.name == channel).First().id;
            var channels = db.UserChannelMappings.Where(m => m.channelid == channelId && m.type == "join");
            var users = db.Users.Where(u => channels.Where(c => c.userid == u.id).Count() > 0);
            return Json(users, JsonRequestBehavior.AllowGet);
        }

        public void Logout()
        {
            DataClassesDataContext db = new DataClassesDataContext();
            try
            {
                var channels = db.UserChannelMappings.Where(m => m.userid == (int)Session["userid"] && m.type == "join");
                db.UserChannelMappings.DeleteAllOnSubmit(channels);
                db.SubmitChanges();
            }
            catch (Exception e) { }
            Session.Clear();
        }
    }
}
