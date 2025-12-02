import { Request, Response } from 'express'
import User from '../models/User'
import Call from '../models/Call'
import { sendSuccessResponse, sendBadRequestResponse, sendNotFoundResponse, sendServerErrorResponse } from '../helpers/responses/httpResponses'

export class CallController {
  static async list(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params

      const user = await User.findById(userId)
      if (!user) {
        return sendNotFoundResponse(res, 'User not found')
      }

      const calls = await Call.find({ applicationId: user._id }).sort({ createdAt: -1 })
      return sendSuccessResponse(res, 'Calls retrieved', { calls })
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to retrieve calls: ' + error.message)
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params
      const { contactId, duration, notes, date } = req.body

      if (!contactId || !duration || !date) {
        return sendBadRequestResponse(res, 'Contact, duration, and date are required')
      }

      const user = await User.findById(userId)
      if (!user) {
        return sendNotFoundResponse(res, 'User not found')
      }

      const call = await Call.create({
        applicationId: user._id,
        contactId,
        duration,
        notes,
        date
      })

      return sendSuccessResponse(res, 'Call logged', { call })
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to log call: ' + error.message)
    }
  }
}
