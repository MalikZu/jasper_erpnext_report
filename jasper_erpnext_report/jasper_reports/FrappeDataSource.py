__author__ = 'saguas'

import frappe
from jnius import PythonJavaClass, java_method

class JasperCustomDataSourceDefault(object):
	""" Get fields for each id default ignore data and cols.
		params: data an cols have meaning when used with Table DataSource and are here for custom implementation.
	"""
	def __init__(self, ids, data=None, cols=None, doctype=None):
		if isinstance(ids, basestring):
			ids = [ids]

		self.ids = ids or []
		self.doctype = doctype
		self.currididx = -1
		self.totalrows = len(self.ids)

	def next(self):
		ret = True
		self.currididx += 1
		if self.currididx >= self.totalrows:
			ret = False
		else:
			self.docname = self.ids[self.currididx]
			self.doc = frappe.get_doc(self.doctype, self.docname).as_dict()

		return ret

	def moveFirst(self):
		self.currididx = -1

	def getFieldValue(self, field):
		doctype = self.doctype
		docname = self.docname

		na = field.split(":")
		print "split custom datasource %s" % na
		l = len(na)
		"""
		if l>2 and field.startswith(":table"):
			#doc table
			values = na[2:]
			table_name = values[0]
			if values > 4:
				doctype = values[1]
				docname = values[2]
				field = values[3]
			elif values > 2:
				docname = values[1]
				field = values[2]

			doc = frappe.get_doc(doctype, docname)
			table = doc.get(table_name)
			if self.currididx < len(table):
				value = doc.get(table_name)[self.currididx].get(field, "")
			else:
				value = ""
		else:
		"""
		if l > 2:
			doctype = na[0]
			docname = na[1]
			field = na[2]
		elif l > 1:
			docname = na[0]
			field = na[1]

		if l > 1:
			value = frappe.db.get_value(doctype, filters=docname, fieldname=field)
		else:
			value = self.doc.get(field, "")

		return value


class _JasperCustomDataSource(PythonJavaClass):
	__javainterfaces__ = ['IFrappeDataSource']

	def __init__(self, jds):
		super(_JasperCustomDataSource, self).__init__()
		self.jds = jds

	@java_method('()Z')
	def next(self):
		return self.jds.next()

	@java_method('()')
	def moveFirst(self):
		return self.jds.moveFirst()

	@java_method('(Ljava/lang/String;)Ljava/lang/String;')
	def getFieldValue(self, fname):
		return self.jds.getFieldValue(fname)
