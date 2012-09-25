using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ASPOblig.Controllers
{
    public class ChatController : Controller
    {
        private static DataClassesDataContext db = new DataClassesDataContext();

        //
        // GET: /Chat/

        private static int head = 0;
        
        public ActionResult Index()
        {
            return View();
        }

        public void Join()
        {
            if (Session["join"] == null)
            {
                Session["lastRequest"] = DateTime.Now;
                Session["currentPos"] = 0;
                Session["join"] = true;
            }
        }

        public void SendMessage(string message, string destination)
        {
            if (message != null)
            {
                db.Messages.InsertOnSubmit(new Message { 
                    sender = Session["nick"].ToString(), 
                    destination = destination, 
                    message = message, 
                    datetime = DateTime.Now });                
                db.SubmitChanges();

                head++;
            }
        }

        public ActionResult GetMessages()
        {
            int currentPos = (int)Session["currentPos"];
            
            if (head > currentPos)
            {
                var messages = db.Messages.ToList();
                messages.Reverse();
                var messages2 = messages.Take(head - currentPos);
                currentPos += head - currentPos;
                Session["currentPos"] = currentPos;
                return Json(messages2, JsonRequestBehavior.AllowGet);
            }

            //Session["lastRequest"] = DateTime.Now;
            return Json(null, JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetUserData()
        {
            return Content(Session["nick"].ToString());
        }

        public void JoinChannel(string channel)
        {
            if (db.Channels.Where(c => c.name == channel).Count() < 1)
            {
                db.Channels.InsertOnSubmit(new Channel { name = channel });
                db.SubmitChanges();
            }

            db.UserChannelMappings.InsertOnSubmit(new UserChannelMapping { userid = (int)Session["userid"], channelid = db.Channels.Where(c => c.name == channel).First().id, type = "join" });
            db.SubmitChanges();
        }

        public ActionResult GetUsers(string channel)
        {
            int channelId = db.Channels.Where(c => c.name == channel).First().id;
            var channels = db.UserChannelMappings.Where(m => m.id == channelId);
            var users = db.Users.Where(u => channels.Where(c => c.userid == u.id).Count() > 0);
            return Json(users, JsonRequestBehavior.AllowGet);
        }

        public void Logout()
        {
            try
            {
                var channels = db.UserChannelMappings.Where(m => m.userid == (int)Session["userid"]);
                db.UserChannelMappings.DeleteAllOnSubmit(channels);
            }
            catch (Exception e) { }
        }
    }
}
