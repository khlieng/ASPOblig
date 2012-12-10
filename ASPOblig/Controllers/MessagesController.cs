using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using ASPOblig.Models;

namespace ASPOblig.Controllers
{
    public class MessagesController : Controller
    {
        //
        // GET: /Messages/
        DataClassesDataContext db = new DataClassesDataContext();

        public ActionResult Index()
        {
            List<Message> m = db.Messages.ToList();
            return View(m);
        }

        //
        // GET: /Messages/Details/5

        public ActionResult Details(int id)
        {

            Message m = (from o in db.Messages
                         where o.id == id
                         select o).FirstOrDefault();
            return View(m);
        }

        //
        // GET: /Messages/Create

        public ActionResult Create()
        {
            return View("Create");
        } 

        //
        // POST: /Messages/Create

        [HttpPost]
        public ActionResult Create(FormCollection collection)
        {
            Message m = new Message();
            try
            {
                // TODO: Add insert logic here
                UpdateModel(m);
                db.Messages.InsertOnSubmit(m);
                db.SubmitChanges();
                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }
        
        //
        // GET: /Messages/Edit/5
 
        public ActionResult Edit(int id)
        {
            Message m = (from o in db.Messages
                         where o.id == id
                         select o).FirstOrDefault();
            return View(m);
        }

        //
        // POST: /Messages/Edit/5

        [HttpPost]
        public ActionResult Edit(int id, FormCollection collection)
        {
            Message m = (from o in db.Messages
                         where o.id == id
                         select o).FirstOrDefault();
            try
            {
                // TODO: Add update logic here
                UpdateModel(m);
                db.SubmitChanges();
                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }

        //
        // GET: /Messages/Delete/5
 
        public ActionResult Delete(int id)
        {
            Message m = (from o in db.Messages
                         where o.id == id
                         select o).FirstOrDefault();
            return View(m);
        }

        //
        // POST: /Messages/Delete/5

        [HttpPost]
        public ActionResult Delete(int id, FormCollection collection)
        {
            Message m = (from o in db.Messages
                         where o.id == id
                         select o).FirstOrDefault();
            try
            {
                // TODO: Add delete logic here
                db.Messages.DeleteOnSubmit(m);
                db.SubmitChanges();
                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }
    }
}
