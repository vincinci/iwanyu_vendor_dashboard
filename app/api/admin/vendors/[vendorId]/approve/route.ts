import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const vendorId = params.vendorId

    // Update vendor status to approved
    const { data, error } = await supabase
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', vendorId)
      .eq('role', 'vendor')
      .select()

    if (error) {
      console.error('Error approving vendor:', error)
      return NextResponse.json({ error: 'Failed to approve vendor' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Vendor approved successfully',
      vendor: data[0]
    })

  } catch (error) {
    console.error('Admin vendor approval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
