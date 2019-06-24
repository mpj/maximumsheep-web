import React from 'react'

import { shallow, configure } from 'enzyme'
import StartingSoon from './index'
import Adapter from 'enzyme-adapter-react-16';

describe('<StartingSoon />', () => {
  let wrapper
  beforeEach(() => {
    configure({ adapter: new Adapter() })
    wrapper = shallow(<StartingSoon />)
  })
  
  
  it('renders a title', () => {
    expect(wrapper.find('.header').text()).toContain(
      'Stream starting in')
  })
})
