import { Request, Response } from 'express'
import AmbassadorApplication from '../models/AmbassadorApplication'
import Contact from '../models/Contact'
import { sendSuccessResponse, sendBadRequestResponse, sendNotFoundResponse, sendServerErrorResponse } from '../helpers/responses/httpResponses'

export class ContactController {
  static async list(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId } = req.params
      const q = String(req.query.q || '').trim()

      const application = await AmbassadorApplication.findById(applicationId)
      if (!application) {
        return sendNotFoundResponse(res, 'Application not found')
      }

      const filter: any = { applicationId: application._id }
      if (q) {
        const regex = new RegExp(q, 'i')
        filter.$or = [{ name: regex }, { company: regex }, { event: regex }, { note: regex }, { address: regex }, { linkedinUrl: regex }]
      }

      const contacts = await Contact.find(filter).sort({ updatedAt: -1 })
      return sendSuccessResponse(res, 'Contacts retrieved', { contacts })
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to retrieve contacts: ' + error.message)
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId } = req.params
      const { name, company, avatar, event, note, phone, email, address, linkedinUrl, starred } = req.body

      if (!name) {
        return sendBadRequestResponse(res, 'Name is required')
      }

      const application = await AmbassadorApplication.findById(applicationId)
      if (!application) {
        return sendNotFoundResponse(res, 'Application not found')
      }

      const contact = await Contact.create({
        applicationId: application._id,
        name,
        company,
        avatar,
        event,
        note,
        phone,
        email,
        address,
        linkedinUrl,
        starred: Boolean(starred)
      })

      return sendSuccessResponse(res, 'Contact created', { contact })
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to create contact: ' + error.message)
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId, contactId } = req.params
      const update = req.body || {}

      const application = await AmbassadorApplication.findById(applicationId)
      if (!application) {
        return sendNotFoundResponse(res, 'Application not found')
      }

      const contact = await Contact.findOneAndUpdate(
        { _id: contactId, applicationId: application._id },
        update,
        { new: true }
      )

      if (!contact) {
        return sendNotFoundResponse(res, 'Contact not found')
      }

      return sendSuccessResponse(res, 'Contact updated', { contact })
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to update contact: ' + error.message)
    }
  }

  static async remove(req: Request, res: Response): Promise<Response> {
    try {
      const { applicationId, contactId } = req.params

      const application = await AmbassadorApplication.findById(applicationId)
      if (!application) {
        return sendNotFoundResponse(res, 'Application not found')
      }

      const deleted = await Contact.findOneAndDelete({ _id: contactId, applicationId: application._id })
      if (!deleted) {
        return sendNotFoundResponse(res, 'Contact not found')
      }

      return sendSuccessResponse(res, 'Contact deleted', { id: contactId })
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to delete contact: ' + error.message)
    }
  }
}