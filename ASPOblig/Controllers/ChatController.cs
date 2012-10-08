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

        public void JoinChannel(string channel)
        {
            DataClassesDataContext db = new DataClassesDataContext();
            if (db.Channels.Where(c => c.name == channel).Count() < 1)
            {
                db.Channels.InsertOnSubmit(new Channel { name = channel });
                db.SubmitChanges();
            }

            db.UserChannelMappings.InsertOnSubmit(new UserChannelMapping 
            { 
                userid = (int)Session["userid"], 
                channelid = db.Channels.Where(c => c.name == channel).First().id, 
                type = "join" 
            });
            db.SubmitChanges();
        }

        public void LeaveChannel(string channel)
        {
            DataClassesDataContext db = new DataClassesDataContext();
            int channelId = db.Channels.Where(c => c.name == channel).First().id;
            var mappings = db.UserChannelMappings.Where(ucm => ucm.userid == (int)Session["userid"] && ucm.channelid == channelId);
            db.UserChannelMappings.DeleteAllOnSubmit(mappings);
            db.SubmitChanges();
        }

        public ActionResult GetUsers(string channel)
        {
            DataClassesDataContext db = new DataClassesDataContext();
            int channelId = db.Channels.Where(c => c.name == channel).First().id;
            var channels = db.UserChannelMappings.Where(m => m.channelid == channelId);
            var users = db.Users.Where(u => channels.Where(c => c.userid == u.id).Count() > 0);
            return Json(users, JsonRequestBehavior.AllowGet);
        }

        public void Logout()
        {
            DataClassesDataContext db = new DataClassesDataContext();
            try
            {
                var channels = db.UserChannelMappings.Where(m => m.userid == (int)Session["userid"]);
                db.UserChannelMappings.DeleteAllOnSubmit(channels);
                db.SubmitChanges();
            }
            catch (Exception e) { }
            Session.Clear();
        }
    }
}
