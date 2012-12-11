using System;
using System.Text;
using System.Collections.Generic;
using System.Linq;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Web.Mvc;
using ASPOblig.Controllers;

namespace ASPObligTest.Controllers
{
    [TestClass]
    public class AdminControllerTest
    {
        [TestMethod]
        public void IsEmty()
        {
            AdminController ac = new AdminController();

            ViewResult result = ac.Index() as ViewResult;

            Assert.IsTrue(string.IsNullOrWhiteSpace(result.ViewBag.Message));
        }
    }
}
