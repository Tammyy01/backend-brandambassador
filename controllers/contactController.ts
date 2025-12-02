import { Request, Response } from 'express'
import User from '../models/User'
import Contact from '../models/Contact'
import { sendSuccessResponse, sendBadRequestResponse, sendNotFoundResponse, sendServerErrorResponse } from '../helpers/responses/httpResponses'

export class ContactController {
  static async list(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params
      const q = String(req.query.q || '').trim()

      const user = await User.findById(userId)
      if (!user) {
        return sendNotFoundResponse(res, 'User not found')
      }

      const filter: any = { applicationId: user._id } // Keeping applicationId in Contact model for now, but referencing user._id
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
      const { userId } = req.params
      const { name, company, avatar, event, note, phone, email, address, linkedinUrl, starred, title } = req.body

      if (!name) {
        return sendBadRequestResponse(res, 'Name is required')
      }

      const user = await User.findById(userId)
      if (!user) {
        return sendNotFoundResponse(res, 'User not found')
      }

      const contact = await Contact.create({
        applicationId: user._id,
        name,
        company,
        avatar,
        event,
        note,
        phone,
        email,
        address,
        linkedinUrl,
        title,
        starred: Boolean(starred)
      })

      return sendSuccessResponse(res, 'Contact created', { contact })
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to create contact: ' + error.message)
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, contactId } = req.params
      const update = req.body || {}

      const user = await User.findById(userId)
      if (!user) {
        return sendNotFoundResponse(res, 'User not found')
      }

      const contact = await Contact.findOneAndUpdate(
        { _id: contactId, applicationId: user._id },
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

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, contactId } = req.params

      const user = await User.findById(userId)
      if (!user) {
        return sendNotFoundResponse(res, 'User not found')
      }

      const contact = await Contact.findOne({ _id: contactId, applicationId: user._id })
      if (!contact) {
        return sendNotFoundResponse(res, 'Contact not found')
      }

      return sendSuccessResponse(res, 'Contact retrieved', { contact })
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to retrieve contact: ' + error.message)
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, contactId } = req.params

      const user = await User.findById(userId)
      if (!user) {
        return sendNotFoundResponse(res, 'User not found')
      }

      const deleted = await Contact.findOneAndDelete({ _id: contactId, applicationId: user._id })
      if (!deleted) {
        return sendNotFoundResponse(res, 'Contact not found')
      }

      return sendSuccessResponse(res, 'Contact deleted', { id: contactId })
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to delete contact: ' + error.message)
    }
  }

  static async toggleStar(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, contactId } = req.params

      const user = await User.findById(userId)
      if (!user) {
        return sendNotFoundResponse(res, 'User not found')
      }

      const contact = await Contact.findOne({ _id: contactId, applicationId: user._id })
      if (!contact) {
        return sendNotFoundResponse(res, 'Contact not found')
      }

      contact.starred = !contact.starred
      await contact.save()

      return sendSuccessResponse(res, 'Contact star status updated', { contact })
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to update contact star status: ' + error.message)
    }
  }
}