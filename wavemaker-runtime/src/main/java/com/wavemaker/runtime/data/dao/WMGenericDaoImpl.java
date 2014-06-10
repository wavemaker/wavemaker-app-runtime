package com.wavemaker.runtime.data.dao;

import com.wavemaker.runtime.data.jpa.expression.QueryFilter;
import org.hibernate.Criteria;
import org.hibernate.criterion.MatchMode;
import org.hibernate.criterion.Restrictions;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.hibernate4.HibernateTemplate;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import java.io.Serializable;
import java.lang.reflect.ParameterizedType;

public abstract class WMGenericDaoImpl<Entity extends Serializable, Identifier extends Serializable> implements WMGenericDao<Entity, Identifier>  {

	private Class<Entity> entityClass;

    public abstract HibernateTemplate getTemplate();

    @SuppressWarnings("unchecked")
	@PostConstruct
	public void init() {
        if(getTemplate() == null)
            throw new RuntimeException("hibernate template is not set.");

		ParameterizedType genericSuperclass = (ParameterizedType) getClass().getGenericSuperclass();
		this.entityClass = (Class<Entity>) genericSuperclass.getActualTypeArguments()[0];
	}
	
	@Transactional
	public Entity create(Entity entity) {
        Identifier identifier = (Identifier) getTemplate().save(entity);
        return findById(identifier);
	}

	@Transactional
	public void update(Entity entity) {
        getTemplate().update(entity);
	}

	@Transactional
	public void delete(Entity entity) {
        getTemplate().delete(entity);
	}

	@Transactional(readOnly=true)
	public Entity findById(Identifier entityId) {
		return getTemplate().get(entityClass, entityId);
	}

	@Transactional(readOnly=true)
	public Page<Entity> list() {
		return new PageImpl<Entity>(getTemplate().loadAll(entityClass));
	}

	@Transactional(readOnly=true)
	public Page<Entity> search(QueryFilter queryFilters[], Pageable pageable) {
		Criteria criteria = getTemplate().getSessionFactory().getCurrentSession().createCriteria(entityClass);
        if(queryFilters != null && queryFilters.length > 0) {
            for (QueryFilter queryFilter : queryFilters) {
                switch (queryFilter.getFilterCondition()) {
                    case EQUALS:
                        criteria.add(Restrictions.eq(queryFilter.getAttributeName(), queryFilter.getAttributeValue()));
                        break;
                    case STARTING_WITH:
                        criteria.add(Restrictions.ilike(queryFilter.getAttributeName(), String.valueOf(queryFilter.getAttributeValue()), MatchMode.START));
                        break;
                    case ENDING_WITH:
                        criteria.add(Restrictions.ilike(queryFilter.getAttributeName(), String.valueOf(queryFilter.getAttributeValue()), MatchMode.END));
                        break;
                    case CONTAINING:
                        criteria.add(Restrictions.ilike(queryFilter.getAttributeName(), String.valueOf(queryFilter.getAttributeValue()), MatchMode.ANYWHERE));
                        break;
                    default:
                        throw new RuntimeException("Unhandled filter condition: " + queryFilter.getFilterCondition());
                }
            }
        }
		return new PageImpl<Entity>(criteria.list());
	}

    @Override
    public Page<Entity> list(Pageable pageable) {
        return search(null, pageable);
    }

    @Override
    public long count() {
        return getTemplate().loadAll(entityClass).size();
    }
}
