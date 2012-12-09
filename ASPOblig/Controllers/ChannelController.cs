using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using ASPOblig.Models;

namespace ASPOblig.Controllers
{
    public class ChannelController : Controller
    {
        //
        // GET: /Channel/
        DataClassesDataContext db = new DataClassesDataContext();

        public ActionResult Index()
        {
            List<Channel> c = db.Channels.ToList();
            return View(c);
        }

        //
        // GET: /Channel/Details/5

        public ActionResult Details(int id)
        {
            Channel c = (from o in db.Channels
                         where o.id == id
                         select o).FirstOrDefault();
            return View(c);
        }

        //
        // GET: /Channel/Create

        public ActionResult Create()
        {

            return View("Create");
        } 

        //
        // POST: /Channel/Create

        [HttpPost]
        public ActionResult Create(FormCollection collection)
        {
            Channel c = new Channel();
            try
            {
                // TODO: Add insert logic here
                UpdateModel(c);
                db.Channels.InsertOnSubmit(c);
                db.SubmitChanges();
                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }
        
        //
        // GET: /Channel/Edit/5
 
        public ActionResult Edit(int id)
        {
            Channel c = (from o in db.Channels
                         where o.id == id
                         select o).FirstOrDefault();
            return View(c);
        }

        //
        // POST: /Channel/Edit/5

        [HttpPost]
        public ActionResult Edit(int id, FormCollection collection)
        {
            Channel c = (from o in db.Channels
                         where o.id == id
                         select o).FirstOrDefault();
            try
            {
                // TODO: Add update logic here
                UpdateModel(c);
                db.SubmitChanges();
                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }

        //
        // GET: /Channel/Delete/5
 
        public ActionResult Delete(int id)
        {
            Channel c = (from o in db.Channels
                         where o.id == id
                         select o).FirstOrDefault();
            return View(c);
        }

        //
        // POST: /Channel/Delete/5

        [HttpPost]
        public ActionResult Delete(int id, FormCollection collection)
        {
            Channel c = (from o in db.Channels
                         where o.id == id
                         select o).FirstOrDefault();
            try
            {
                // TODO: Add delete logic here
                db.Channels.DeleteOnSubmit(c);
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
