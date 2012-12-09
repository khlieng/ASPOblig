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

        
        /// <summary>
        /// brukes til join av kananl
        /// </summary>
        public void Join()
        {
            DataClassesDataContext db = new DataClassesDataContext();
            if (Session["join"] == null)
            {
                Session["currentPos"] = db.Messages.Max(m => m.id);
                Session["join"] = true;
            }
        }

        /// <summary>
        /// Sender meldinger, og lagrer de i databasen.
        /// </summary>
        /// <param name="message"></param>
        /// <param name="destination"></param>
        public ActionResult SendMessage(string message, string destination)
        {
            System.Diagnostics.Debug.WriteLine(message);

            DataClassesDataContext db = new DataClassesDataContext();
            if (!String.IsNullOrWhiteSpace(message))
            {
                using (System.IO.StreamWriter sw = new System.IO.StreamWriter(AppDomain.CurrentDomain.BaseDirectory + "out.txt"))
                {
                    sw.WriteLine(message);
                }
                Message messageObj = new Message
                {
                    sender = Session["nick"].ToString(),
                    destination = destination,
                    message = message,
                    datetime = DateTime.Now
                };
                db.Messages.InsertOnSubmit(messageObj);
                db.SubmitChanges();

                return Content(messageObj.id + "");
            }
            return Content(-1 + "");
        }

        /// <summary>
        /// Brukes for og returnere meldinger, henter fra databasen.
        /// </summary>
        /// <returns></returns>
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

        /// <summary>
        /// Brukes når man joiner en channel. 
        /// lagrere setting for en kanal; Owner, Mode og om den er Private eller åpen for alle
        /// Alt lagres i databasen
        /// </summary>
        /// <param name="channel"></param>
        /// <returns></returns>
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
                        var channels3 = db.UserChannelMappings.Where(m => m.channelid == channelId && m.type == "allowed");
                        var users3 = db.Users.Where(u => channels3.Where(c => c.userid == u.id).Count() > 0);
                        if (users3.Where(u => u.id == (int)Session["userid"]).Count() > 0)
                        {
                            userType = "user";
                        }
                        else
                        {
                            userType = "DENIED";
                        }
                    }
                    else
                    {
                        userType = "user";
                    }
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

        /// <summary>
        /// Metode for og registrere at en bruker har forlatt en chatte kanal.
        /// </summary>
        /// <param name="channel"></param>
        public void LeaveChannel(string channel)
        {
            DataClassesDataContext db = new DataClassesDataContext();
            int channelId = db.Channels.Where(c => c.name == channel).First().id;
            var mappings = db.UserChannelMappings.Where(ucm => ucm.userid == (int)Session["userid"] && ucm.channelid == channelId);
            db.UserChannelMappings.DeleteAllOnSubmit(mappings);
            db.SubmitChanges();
        }

        /// <summary>
        /// Metode brukes for og returnere kanal instillingen på klient siden 
        ///
        /// </summary>
        /// <param name="channel"></param>
        /// <returns></returns>
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

        /// <summary>
        /// Metoden brukers for og sette innstillinger på en gitt kanal.
        /// </summary>
        /// <param name="channel"></param>
        /// <param name="type"></param>
        /// <param name="allowed"></param>
        /// <param name="mods"></param>
        /// <returns></returns>
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

        /// <summary>
        /// Returnerer brukeres som er i en gitt kanal
        /// </summary>
        /// <param name="channel"></param>
        /// <returns></returns>
        public ActionResult GetUsers(string channel)
        {
            DataClassesDataContext db = new DataClassesDataContext();
            int channelId = db.Channels.Where(c => c.name == channel).First().id;
            var channels = db.UserChannelMappings.Where(m => m.channelid == channelId && m.type == "join");
            var users = db.Users.Where(u => channels.Where(c => c.userid == u.id).Count() > 0);
            return Json(users, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Brukes for og logge ut. 
        /// Nick fjernes fra brukerlisten
        /// </summary>
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

        public void FileUpload()
        {
            using (System.IO.StreamWriter sw = new System.IO.StreamWriter(AppDomain.CurrentDomain.BaseDirectory + "out.txt"))
            {
                sw.WriteLine(Request.Files[0].FileName);
            }

            foreach (string file in Request.Files)
            {
                string path = AppDomain.CurrentDomain.BaseDirectory;
                
                Request.Files[file].SaveAs(System.IO.Path.Combine(path, System.IO.Path.GetFileName(Request.Files[file].FileName)));
            }
        }
    }
}
