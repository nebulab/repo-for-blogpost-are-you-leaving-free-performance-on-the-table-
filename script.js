import http from 'k6/http';
import { sleep, group } from 'k6';

export const options = {
  scenarios: {
    contacts: {
      executor: 'per-vu-iterations',
      vus: 50,
      iterations: 1,
    },
  },
};

export default function () {
  let response

  const vars = {}

  group('landing_page', function () {
    http.get(`${__ENV.BASE_PATH}`)
    http.get(`${__ENV.BASE_PATH}/cart_link`)

    sleep(4.2)
  })

  group('pdp_solidus_tote', function () {
    http.get(`${__ENV.BASE_PATH}/products/solidus-tote`)
    http.get(`${__ENV.BASE_PATH}/cart_link`)

    sleep(4.1)
  })

  group('plp_clothing', function () {
    response = http.get(`${__ENV.BASE_PATH}/t/categories/clothing`)
    http.get(`${__ENV.BASE_PATH}/cart_link`)

    sleep(4.3)
  })

  group('plp_clothing_search_hoodie', function () {
    vars['taxonId'] = response.html().find('option[selected="selected"]').first().attr('value')

    http.get(`${__ENV.BASE_PATH}/products?taxon=${vars['taxonId']}&keywords=hoodie&button=`)
    http.get(`${__ENV.BASE_PATH}/cart_link`)

    sleep(2.6)
  })

  group('pdp_ruby_hoodie', function () {
    response = http.get(`${__ENV.BASE_PATH}/products/ruby-hoodie?taxon_id=${vars['taxonId']}`)

    vars['variantId'] = response.html().find('input[name=variant_id]').first().attr('value')

    http.get(`${__ENV.BASE_PATH}/cart_link`)

    sleep(4.5)
  })

  group('add_to_cart', function () {
    vars['csrfParam'] = response.html().find('meta[name=csrf-param]').attr('content')
    vars['csrfToken'] = response.html().find('meta[name=csrf-token]').attr('content')
    response = http.post(`${__ENV.BASE_PATH}/cart_line_items`, {
      'variant_id': vars['variantId'],
      'quantity': 1,
      [vars['csrfParam']]: vars['csrfToken']
    });

    http.get(`${__ENV.BASE_PATH}/cart_link`)

    sleep(4.2)

    vars['csrfParam'] = response.html().find('meta[name=csrf-param]').attr('content')
    vars['csrfToken'] = response.html().find('meta[name=csrf-token]').attr('content')
    vars['quantity'] = response.html().find('#order_line_items_attributes_0_quantity').attr('value')
    vars['id'] = response.html().find('#order_line_items_attributes_0_id').attr('value')

    response = http.patch(`${__ENV.BASE_PATH}/cart`, {
      'order[line_items_attributes][0][quantity]': vars['quantity'],
      'order[line_items_attributes][0][id]': vars['id'],
      [vars['csrfParam']]: vars['csrfToken']
    });

    http.get(`${__ENV.BASE_PATH}/cart_link`)

    sleep(7.6)
  })

  group('checkout_as_a_guest', function () {
    vars['email'] = `test=${Math.floor(Math.random() * 1000)}@example.com`
    vars['csrfParam'] = response.html().find('meta[name=csrf-param]').attr('content')
    vars['csrfToken'] = response.html().find('meta[name=csrf-token]').attr('content')
    response = http.post(`${__ENV.BASE_PATH}/checkout_guest_session`, {
      'order[email]': vars['email'],
      [vars['csrfParam']]: vars['csrfToken']
    });

    sleep(0.5)

    http.get(`${__ENV.BASE_PATH}/cart_link`)
  })

  group('address_page', function () {
    vars['countryId'] = response.html().find('option[selected="selected"]').filter(function (_idx, el) {
      return el.text() === 'United States of America'
    }).first().attr('value')
    vars['stateId'] = response.html().find('option').filter(function (_idx, el) {
      return el.text() === 'New York'
    }).first().attr('value')

    http.get(`${__ENV.BASE_PATH}/api/states?country_id=${vars['countryId']}`)
    http.get(`${__ENV.BASE_PATH}/api/states?country_id=${vars['countryId']}`)

    sleep(19.9)

    vars['csrfParam'] = response.html().find('meta[name=csrf-param]').attr('content')
    vars['csrfToken'] = response.html().find('meta[name=csrf-token]').attr('content')
    response = http.patch(`${__ENV.BASE_PATH}/checkout/update/address`, {
      'order[email]': vars['email'],
      'order[bill_address_attributes][name]': 'fdg',
      'order[bill_address_attributes][address1]': 'fdg',
      'order[bill_address_attributes][address2]': 'dfg',
      'order[bill_address_attributes][city]': 'gfdsg',
      'order[bill_address_attributes][country_id]': vars['countryId'],
      'order[bill_address_attributes][state_id]': vars['stateId'],
      'order[bill_address_attributes][zipcode]': 10001,
      'order[bill_address_attributes][phone]': 43625643,
      'order[use_billing]': 1,
      [vars['csrfParam']]: vars['csrfToken']
    });

    http.get(`${__ENV.BASE_PATH}/cart_link`)

    sleep(9.5)
  });

  group('delivery_page', function () {
    vars['csrfParam'] = response.html().find('meta[name=csrf-param]').attr('content')
    vars['csrfToken'] = response.html().find('meta[name=csrf-token]').attr('content')
    vars['rate'] = response.html().find('input[type="radio"]').first().attr('value')
    vars['id'] = response.html().find('#order_shipments_attributes_0_id').attr('value')
    response = http.patch(`${__ENV.BASE_PATH}/checkout/update/delivery`, {
      'order[shipments_attributes][0][selected_shipping_rate_id]': vars['rate'],
      'order[shipments_attributes][0][id]': vars['id'] ,
      [vars['csrfParam']]: vars['csrfToken']
    });

    http.get(`${__ENV.BASE_PATH}/cart_link`)

    sleep(4.2)
  });

  group('payment_page', function () {
    vars['paymentMethodId'] = 3
    vars['csrfParam'] = response.html().find('meta[name=csrf-param]').attr('content')
    vars['csrfToken'] = response.html().find('meta[name=csrf-token]').attr('content')
    response = http.patch(`${__ENV.BASE_PATH}/checkout/update/payment`, {
      'order[payments_attributes][][payment_method_id]': vars['paymentMethodId'],
      'payment_source[2][name]': 'fdg',
      'payment_source[2][address_attributes][name]': 'fdg',
      'payment_source[2][address_attributes][address1]': 'fdg',
      'payment_source[2][address_attributes][address2]': 'dfg',
      'payment_source[2][address_attributes][city]': 'gfdsg',
      'payment_source[2][address_attributes][country_id]': vars['countryId'],
      'payment_source[2][address_attributes][state_id]': vars['stateId'],
      'payment_source[2][address_attributes][zipcode]': 10001,
      'payment_source[2][address_attributes][phone]': 43625643,
      [vars['csrfParam']]: vars['csrfToken']
    });

    http.get(`${__ENV.BASE_PATH}/cart_link`)

    sleep(9.5)
  });

  group('confirm_page', function () {
    vars['csrfParam'] = response.html().find('meta[name=csrf-param]').attr('content')
    vars['csrfToken'] = response.html().find('meta[name=csrf-token]').attr('content')
    http.patch(`${__ENV.BASE_PATH}/checkout/update/confirm`, {
      'accept_terms_and_conditions': 'accepted',
      [vars['csrfParam']]: vars['csrfToken']
    });

    http.get(`${__ENV.BASE_PATH}/cart_link`)

    sleep(6.3)
  });

  http.get(`${__ENV.BASE_PATH}`)
}
