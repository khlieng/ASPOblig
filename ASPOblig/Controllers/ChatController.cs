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

        private static int head = 0;
        
        public ActionResult Index()
        {
            return View();
        }

        public void Join()
        {
            Session["lastRequest"] = DateTime.Now;
            Session["currentPos"] = 0;
        }

        public void SendMessage(string message)
        {
            if (message != null)
            {
                DataClassesDataContext db = new DataClassesDataContext();
                db.Messages.InsertOnSubmit(new Message { sender = "Herp", destination = "Lobby", message = message, datetime = DateTime.Now });                
                db.SubmitChanges();

                head++;
            }
        }

        public ActionResult GetMessages()
        {
            DataClassesDataContext db = new DataClassesDataContext();
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
    }
}
